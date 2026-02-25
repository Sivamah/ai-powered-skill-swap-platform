from typing import List, Optional, Dict
import json
import logging
import os
import asyncio
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from pydantic import BaseModel

from database import create_db_and_tables, get_session
from models import User, UserCreate, UserRead, UserUpdate, Session as DbSession, SessionBase, Transaction, Review, ReviewCreate, AuditLog, LearningPath, ProjectVerification
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from ai_engine import SkillMatcher
from seed_data import seed_data
from quiz_engine import QuizGenerator
from coding_engine import CodingProblemGenerator, CodeExecutor
from migrations import run_migrations

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Auto-accept configuration (for demo/testing mode only)
# Demo Mode Configuration
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
if DEMO_MODE:
    logger.warning("⚠️ DEMO MODE ENABLED - Auto-accept sessions & Demo User active")

# Use lifespan instead of deprecated on_event
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_db_and_tables()
    # Run lightweight migrations
    run_migrations()
    
    # Log Routes
    for route in app.routes:
        logger.info(f"Route: {route.path} methods={route.methods}")
    
    # Seed data for demo mode
    try:
        seed_data()
    except Exception as e:
        logger.error(f"Seed data error (non-fatal): {e}")
    yield
    # Shutdown (if needed)
    pass

app = FastAPI(title="Skill Swap AI Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

matcher = SkillMatcher()
quiz_gen = QuizGenerator()
coding_gen = CodingProblemGenerator()
code_executor = CodeExecutor()


# Helper for Audit Logs
def log_audit(session_db: Session, action: str, details: str, user_id: int = None):
    try:
        log = AuditLog(action=action, details=details, user_id=user_id)
        session_db.add(log)
        session_db.commit() # Commit immediately for logs
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}", exc_info=True)

# Auth Endpoints
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    try:
        logger.info(f"Login attempt for user: {form_data.username}")
        statement = select(User).where(User.email == form_data.username)
        user = session.exec(statement).first()
        
        if not user:
            logger.warning(f"User not found: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not verify_password(form_data.password, user.password_hash):
            logger.warning(f"Password mismatch for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        logger.info(f"Login successful for user: {form_data.username}")
        log_audit(session, "LOGIN", f"User logged in: {user.email}", user.id)
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LOGIN CRITICAL ERROR: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Login Failed: {str(e)}")

@app.post("/register", response_model=UserRead)
def register_user(user: UserCreate, session: Session = Depends(get_session)):
    logger.info(f"Registration attempt for: {user.email}")
    statement = select(User).where(User.email == user.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        logger.warning(f"Registration failed: Email {user.email} already exists")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_data = user.dict()
    user_data.pop("password") 
    db_user = User(**user_data)
    db_user.password_hash = hashed_password
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    log_audit(session, "REGISTER", f"New user registered: {user.email}", db_user.id)
    logger.info(f"Registration successful for: {user.email}")
    return db_user

@app.get("/users/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/user/profile", response_model=UserRead)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile - matches frontend expectation"""
    return current_user

@app.patch("/user/profile", response_model=UserRead)
async def update_user_me(user_update: UserUpdate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    user = session.get(User, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = user_update.dict(exclude_unset=True)
    for key, value in user_data.items():
        setattr(user, key, value)
        
    session.add(user)
    session.commit()
    session.refresh(user)
    
    log_audit(session, "PROFILE_UPDATE", f"User updated profile: {user.email}", user.id)
    return user

# Matching Endpoint (The AI Part)
@app.get("/find_tutor")
def find_tutor(query: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(User).where(User.id != current_user.id)
    candidates = session.exec(statement).all()
    
    matches = matcher.find_matches(query, list(candidates))
    
    results = []
    for m in matches:
        u = m['user']
        # Parse badges
        try:
            badges = json.loads(u.badges)
        except:
            badges = {}
            
        # Parse skills safely
        try:
            skills = json.loads(u.skills_offered)
        except:
            skills = []
            
        results.append({
            "user_id": u.id,
            "name": u.name,
            "skills": skills,
            "badges": badges, # Return badges
            "feedback_summary": u.feedback_summary, # Return summary
            "reputation": u.reputation_score,
            "similarity_score": "{:.2f}".format(m['similarity']),
            "match_score": "{:.2f}".format(m['match_score'])
        })
    return results

@app.post("/request_session")
def request_session(teacher_id: int, skill_name: str, session_type: str = "standard", session_db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    # Validate Teacher exists
    teacher = session_db.get(User, teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if current_user.credits_balance < 1:
        raise HTTPException(status_code=400, detail="Insufficient credits. You must teach to earn credits.")

    current_user.credits_balance -= 1
    session_db.add(current_user)
    
    tx = Transaction(user_id=current_user.id, amount=-1, type="session_spend")
    session_db.add(tx)

    # Create new session
    new_session = DbSession(
        learner_id=current_user.id,
        teacher_id=teacher_id,
        skill_name=skill_name,
        session_type=session_type,
        status="pending"
    )
    session_db.add(new_session)
    session_db.commit()
    session_db.refresh(new_session)
    
    log_audit(session_db, "SESSION_REQUEST", f"Session requested for {skill_name} with teacher {teacher_id}", current_user.id)
    
    # Auto-accept logic for demo mode
    if DEMO_MODE:
        logger.info(f"🤖 AUTO-ACCEPT: Automatically confirming session {new_session.id}")
        new_session.status = "scheduled"
        # Generate Google Meet link (Simulated)
        new_session.meet_link = f"https://meet.google.com/sim-{new_session.id}-meet"
        session_db.add(new_session)
        session_db.commit()
        log_audit(session_db, "SESSION_AUTO_CONFIRM", f"Session {new_session.id} auto-confirmed (Demo Mode)", teacher_id)
        return {
            "message": "Session auto-confirmed (Demo Mode)", 
            "session_id": new_session.id,
            "meet_link": new_session.meet_link,
            "auto_accepted": True
        }
    
    return {"message": "Request sent", "session_id": new_session.id, "auto_accepted": False}

@app.get("/my_sessions")
def get_my_sessions(session_db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(DbSession).where(
        (DbSession.learner_id == current_user.id) | (DbSession.teacher_id == current_user.id)
    )
    raw_sessions = session_db.exec(statement).all()
    
    results = []
    for sess in raw_sessions:
        # Convert to dict compatibility
        data = sess.dict()
        
        is_tutor = (sess.teacher_id == current_user.id)
        other_id = sess.learner_id if is_tutor else sess.teacher_id
        
        other_user = session_db.get(User, other_id)
        data["other_user_name"] = other_user.name if other_user else "Unknown"
        data["is_tutor"] = is_tutor
        
        # Check if the current user (as learner) has already reviewed this session
        if not is_tutor and sess.status == "completed":
            existing_review = session_db.exec(
                select(Review).where(
                    (Review.session_id == sess.id) & (Review.reviewer_id == current_user.id)
                )
            ).first()
            data["review_status"] = "submitted" if existing_review else None
        else:
            data["review_status"] = None
        
        results.append(data)
        
    return results

@app.post("/confirm_session/{session_id}")
def confirm_session(session_id: int, session_db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(DbSession).where(DbSession.id == session_id)
    sess = session_db.exec(statement).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if sess.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only teacher can confirm")
        
    sess.status = "scheduled"
    # Generate Google Meet link (Simulated)
    sess.meet_link = f"https://meet.google.com/sim-{sess.id}-meet"
    session_db.add(sess)
    session_db.commit()
    
    log_audit(session_db, "SESSION_CONFIRM", f"Session {session_id} confirmed", current_user.id)
    return {"message": "Session confirmed", "link": sess.meet_link}

@app.post("/complete_session/{session_id}")
def complete_session(session_id: int, session_db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(DbSession).where(DbSession.id == session_id)
    sess = session_db.exec(statement).first()
    
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if sess.learner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Only learner can mark complete")

    if sess.status == "completed":
        return {"message": "Already completed"}

    sess.status = "completed"
    sess.end_time = datetime.utcnow() # Mark completion time
    session_db.add(sess)
    
    teacher_stmt = select(User).where(User.id == sess.teacher_id)
    teacher = session_db.exec(teacher_stmt).first()
    if teacher:
        teacher.credits_balance += 1
        session_db.add(teacher)
        tx = Transaction(user_id=teacher.id, amount=1, type="session_earn")
        session_db.add(tx)
    
    session_db.commit()
    log_audit(session_db, "SESSION_COMPLETE", f"Session {session_id} completed", current_user.id)
    return {"message": "Session completed. Credits transferred."}

@app.post("/reviews")
def submit_review(review_data: ReviewCreate, session_db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(DbSession).where(DbSession.id == review_data.session_id)
    session_obj = session_db.exec(statement).first()
    
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session_obj.learner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the learner can review this session")
        
    if session_obj.status != "completed":
        raise HTTPException(status_code=400, detail="Session must be completed before reviewing")
        
    existing_review = session_db.exec(select(Review).where(Review.session_id == review_data.session_id)).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this session")
        
    new_review = Review(
        session_id=review_data.session_id,
        reviewer_id=current_user.id,
        reviewee_id=session_obj.teacher_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    session_db.add(new_review)
    session_db.commit()
    session_db.refresh(new_review)
    
    # Update Reputation
    teacher_id = session_obj.teacher_id
    reviews_stmt = select(Review).where(Review.reviewee_id == teacher_id)
    all_reviews = session_db.exec(reviews_stmt).all()
    
    if all_reviews:
        total_score = sum([r.rating for r in all_reviews])
        avg_score = total_score / len(all_reviews)
    else:
        avg_score = float(review_data.rating)
        
    teacher = session_db.get(User, teacher_id)
    if teacher:
        teacher.reputation_score = avg_score
        
        # --- NEW: Generate AI Feedback Summary ---
        comments = [r.comment for r in all_reviews if r.comment]
        summary = matcher.generate_feedback_summary(comments)
        teacher.feedback_summary = summary
        
        session_db.add(teacher)
        session_db.commit()
        
    log_audit(session_db, "REVIEW_SUBMIT", f"Review submitted for session {review_data.session_id}", current_user.id)
    return {"message": "Review submitted, reputation metrics updated."}

@app.get("/quiz/generate")
def generate_quiz(skill: str):
    return quiz_gen.generate_quiz(skill)

class QuizSubmission(BaseModel):
    skill: str
    score: int
    
@app.post("/quiz/verify")
def verify_skill(submission: QuizSubmission, session_db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    # Logic: If Score >= 3 (out of 5), verified.
    # Badging: 5/5 -> Expert, 4/5 -> Intermediate, 3/5 -> Beginner
    
    if submission.score >= 3:
        # Load existing verified skills
        try:
            verified = json.loads(current_user.verified_skills)
        except:
            verified = []
            
        if submission.skill not in verified:
            verified.append(submission.skill)
            current_user.verified_skills = json.dumps(verified)
        
        # --- NEW: Badge Assignment ---
        try:
            badges = json.loads(current_user.badges)
        except:
            badges = {}
            
        badge_level = "Beginner"
        if submission.score == 5:
            badge_level = "Expert"
        elif submission.score == 4:
            badge_level = "Intermediate"
            
        # Update badge if new level is higher or not exists
        # Simplified: always update to latest test result
        badges[submission.skill] = badge_level
        current_user.badges = json.dumps(badges)
            
        session_db.add(current_user)
        session_db.commit()
        
        log_audit(session_db, "SKILL_VERIFY", f"Verified skill {submission.skill} with badge {badge_level}", current_user.id)
        return {"verified": True, "message": f"Congrats! You earned the {badge_level} badge in {submission.skill}."}
    else:
        return {"verified": False, "message": "Score too low. Try again."}

class ProjectSubmission(BaseModel):
    skill_name: str
    project_title: str
    description: str
    technologies: str
    github_url: Optional[str] = None
    demo_link: Optional[str] = None

@app.post("/verify/project")
def verify_project_skill(submission: ProjectSubmission, session_db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """ Endpoint for project-based verification of tech skills. """
    
    # 1. AI Verification
    project_data = submission.dict()
    is_approved, badge_level, feedback = matcher.validate_project_submission(project_data)
    
    # 2. Store Submission Record
    db_submission = ProjectVerification(
        user_id=current_user.id,
        skill_name=submission.skill_name,
        project_title=submission.project_title,
        description=submission.description,
        technologies=submission.technologies,
        github_url=submission.github_url,
        demo_link=submission.demo_link,
        ai_review_status="approved" if is_approved else "rejected",
        ai_feedback=feedback
    )
    session_db.add(db_submission)
    
    if is_approved:
        # 3. Update User Badges & Verified Skills
        try:
            verified = json.loads(current_user.verified_skills)
        except:
            verified = []
            
        if submission.skill_name not in verified:
            verified.append(submission.skill_name)
            current_user.verified_skills = json.dumps(verified)
            
        try:
            badges = json.loads(current_user.badges)
        except:
            badges = {}
            
        badges[submission.skill_name] = badge_level
        current_user.badges = json.dumps(badges)
        
        session_db.add(current_user)
        session_db.commit()
        
        log_audit(session_db, "PROJECT_VERIFY", f"Verified project for {submission.skill_name} ({badge_level})", current_user.id)
        return {
            "verified": True,
            "badge": badge_level,
            "feedback": feedback,
            "message": f"Project accepted! You are now a {badge_level} in {submission.skill_name}."
        }
    else:
        session_db.commit()
        return {
            "verified": False,
            "feedback": feedback,
            "message": "Project verification failed. Please check the feedback."
        }

@app.get("/utils/is_tech_skill")
def check_tech_skill(skill: str):
    return {"is_tech": matcher.is_tech_skill(skill)}

@app.get("/learning-path/{skill}")
def get_learning_path(skill: str):
    path = matcher.generate_learning_path(skill)
    return path

# ============================================
# ENHANCED SKILL VERIFICATION ENDPOINTS
# ============================================

@app.get("/api/verify/classify-skill")
def classify_skill(skill: str):
    """
    Classify skill as programming language or domain
    Returns: {"type": "programming_language" | "domain", "language": "python" | null}
    """
    programming_languages = ["python", "java", "c++", "cpp", "javascript", "js", "c"]
    skill_lower = skill.lower()
    
    # Normalize variations
    if skill_lower in ["c++", "cpp"]:
        skill_lower = "cpp"
    elif skill_lower in ["javascript", "js"]:
        skill_lower = "javascript"
    
    if skill_lower in programming_languages:
        return {
            "type": "programming_language",
            "language": skill_lower
        }
    else:
        return {
            "type": "domain",
            "language": None
        }

@app.get("/api/verify/coding-problems")
def get_coding_problems(language: str):
    """
    Generate 2 coding problems (1 Easy, 1 Medium) for the given language
    Returns: Array of 2 problem objects with test cases
    """
    try:
        problems = coding_gen.generate_problems(language)
        # Ensure test_cases are properly structured for frontend
        for problem in problems:
            # Ensure test_cases exists and is a list
            if "test_cases" not in problem or not isinstance(problem["test_cases"], list):
                # Generate default test cases if missing
                problem["test_cases"] = [
                    {"input": "()", "expected_output": "result", "is_hidden": False},
                    {"input": "()", "expected_output": "result", "is_hidden": True}
                ]
            
            # Separate visible and hidden test cases for frontend display
            problem["visible_test_cases"] = [
                tc for tc in problem["test_cases"] if not tc.get("is_hidden", False)
            ]
            problem["hidden_test_cases"] = [
                tc for tc in problem["test_cases"] if tc.get("is_hidden", False)
            ]
            
            # Keep test_cases for backend execution (don't remove it)
        return problems
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class CodeExecutionRequest(BaseModel):
    language: str
    code: str
    problem_id: str
    run_mode: str = "test"  # "test" or "submit"

@app.post("/api/verify/execute-code")
async def execute_code(request: CodeExecutionRequest):
    """
    Execute submitted code against test cases.
    run_mode: "test" = run visible test cases only, "submit" = run all test cases.
    Runs the blocking Piston API call in a thread so the event loop is not blocked.
    """
    try:
        # Validate code is not empty
        if not request.code or not request.code.strip():
            return {
                "passed": False,
                "total": 0,
                "passedCount": 0,
                "results": [],
                "error": "Code cannot be empty. Please write your solution."
            }
        
        # Get the problem to retrieve test cases
        problems = coding_gen.generate_problems(request.language)
        problem = next((p for p in problems if p["id"] == request.problem_id), None)
        
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")
        
        # Ensure test_cases exists and is a list
        if "test_cases" not in problem or not isinstance(problem["test_cases"], list):
            return {
                "passed": False,
                "total": 0,
                "passedCount": 0,
                "results": [],
                "error": "Test cases not available for this problem"
            }
        
        # Filter test cases based on run mode
        if request.run_mode == "test":
            # Run only visible test cases
            test_cases = [tc for tc in problem["test_cases"] if not tc.get("is_hidden", False)]
        else:
            # Run all test cases
            test_cases = problem["test_cases"]
        
        # Ensure we have test cases to run
        if not test_cases:
            return {
                "passed": False,
                "total": 0,
                "passedCount": 0,
                "results": [],
                "error": "No test cases available"
            }
        
        # Execute code in a thread so the blocking Piston HTTP call
        # does not stall FastAPI's async event loop.
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: code_executor.execute_code(
                language=request.language,
                code=request.code,
                problem_id=request.problem_id,
                test_cases=test_cases
            )
        )
        
        # Calculate passed count
        passed_count = sum(1 for r in result.get("results", []) if r.get("passed", False))
        total_count = len(result.get("results", []))
        
        # Add summary fields
        result["total"] = total_count
        result["passedCount"] = passed_count
        
        # Filter out hidden test case details if in test mode
        if request.run_mode == "test":
            result["results"] = [
                r for r in result["results"] if not r.get("is_hidden", False)
            ]
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Code execution error: {str(e)}", exc_info=True)
        return {
            "passed": False,
            "total": 0,
            "passedCount": 0,
            "results": [],
            "error": f"Execution failed: {str(e)}"
        }

class CodingVerificationSubmission(BaseModel):
    skill: str
    language: str
    problem_results: List[Dict]  # [{"problem_id": "...", "passed": true/false}]

@app.post("/api/verify/coding-submit")
def submit_coding_verification(
    submission: CodingVerificationSubmission,
    session_db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Submit final coding verification
    User must pass ALL test cases for BOTH problems to verify skill
    """
    # Check if all problems passed
    all_passed = all(result.get("passed", False) for result in submission.problem_results)
    
    if all_passed and len(submission.problem_results) == 2:
        # Update verified skills
        try:
            verified = json.loads(current_user.verified_skills)
        except:
            verified = []
        
        if submission.skill not in verified:
            verified.append(submission.skill)
            current_user.verified_skills = json.dumps(verified)
        
        # Assign badge (for coding challenges, always Expert if passed)
        try:
            badges = json.loads(current_user.badges)
        except:
            badges = {}
        
        badges[submission.skill] = "Expert"
        current_user.badges = json.dumps(badges)
        
        # Update verification scores
        try:
            scores = json.loads(current_user.verification_scores) if current_user.verification_scores else {}
        except:
            scores = {}
        
        scores[submission.skill] = {
            "score": 100,
            "method": "coding",
            "date": datetime.utcnow().isoformat()
        }
        current_user.verification_scores = json.dumps(scores)
        
        session_db.add(current_user)
        session_db.commit()
        
        log_audit(session_db, "CODING_VERIFY", f"Verified {submission.skill} via coding challenge", current_user.id)
        
        return {
            "verified": True,
            "badge": "Expert",
            "message": f"Congratulations! You've mastered {submission.skill} through coding challenges."
        }
    else:
        return {
            "verified": False,
            "message": "You must pass all test cases for both problems to verify your skill. Please try again."
        }

class MCQVerificationRequest(BaseModel):
    skill: str
    num_questions: int = 10

@app.post("/api/verify/mcq-questions")
def get_mcq_questions(request: MCQVerificationRequest):
    """
    Generate MCQ questions for a domain
    Returns: Array of question objects
    """
    questions = quiz_gen.generate_quiz(request.skill, request.num_questions)
    return questions

class MCQSubmission(BaseModel):
    skill: str
    answers: List[str]  # User's answers
    questions: List[Dict]  # Original questions with correct answers

@app.post("/api/verify/mcq-submit")
def submit_mcq_verification(
    submission: MCQSubmission,
    session_db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Submit MCQ answers and verify skill
    Passing criteria: 7/10 or higher
    """
    # Calculate score
    correct_count = 0
    total_questions = len(submission.questions)
    
    for i, question in enumerate(submission.questions):
        if i < len(submission.answers) and submission.answers[i] == question["answer"]:
            correct_count += 1
    
    score_percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    passed = correct_count >= 7  # 7/10 required
    
    if passed:
        # Update verified skills
        try:
            verified = json.loads(current_user.verified_skills)
        except:
            verified = []
        
        if submission.skill not in verified:
            verified.append(submission.skill)
            current_user.verified_skills = json.dumps(verified)
        
        # Assign badge based on score
        try:
            badges = json.loads(current_user.badges)
        except:
            badges = {}
        
        if correct_count >= 9:
            badge_level = "Expert"
        elif correct_count >= 8:
            badge_level = "Intermediate"
        else:
            badge_level = "Beginner"
        
        badges[submission.skill] = badge_level
        current_user.badges = json.dumps(badges)
        
        # Update verification scores
        try:
            scores = json.loads(current_user.verification_scores) if current_user.verification_scores else {}
        except:
            scores = {}
        
        scores[submission.skill] = {
            "score": score_percentage,
            "method": "mcq",
            "date": datetime.utcnow().isoformat()
        }
        current_user.verification_scores = json.dumps(scores)
        
        session_db.add(current_user)
        session_db.commit()
        
        log_audit(session_db, "MCQ_VERIFY", f"Verified {submission.skill} via MCQ ({correct_count}/{total_questions})", current_user.id)
        
        return {
            "verified": True,
            "score": correct_count,
            "total": total_questions,
            "percentage": score_percentage,
            "badge": badge_level,
            "message": f"Congratulations! You scored {correct_count}/{total_questions} and earned the {badge_level} badge in {submission.skill}."
        }
    else:
        return {
            "verified": False,
            "score": correct_count,
            "total": total_questions,
            "percentage": score_percentage,
            "message": f"You scored {correct_count}/{total_questions}. You need at least 7/10 to pass. Please try again."
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)

