from typing import List, Dict, Tuple
import json
import math
import collections

TECH_SKILLS = [
    "react", "angular", "vue", "node", "python", "java", "c#", "cpp", "go", "rust",
    "aws", "azure", "gcp", "docker", "kubernetes", "tensorflow", "pytorch", 
    "machine learning", "data science", "sql", "mongodb", "fastapi", "flask", "django"
]

class SkillMatcher:
    def __init__(self):
        pass
        
    def is_tech_skill(self, skill_name: str) -> bool:
        """Determines if a skill is technology-related requiring project verification."""
        skill = skill_name.lower()
        return any(tech in skill for tech in TECH_SKILLS)

    def validate_project_submission(self, project_data: dict) -> Tuple[bool, str, str]:
        """
        AI Verification of project submission.
        Returns: (is_approved, badge_level, feedback)
        """
        # Heuristic Checks
        desc = project_data.get('description', '')
        techs = project_data.get('technologies', '')
        github = project_data.get('github_url', '')
        
        # 1. Content Length Check
        if len(desc.split()) < 10:
            return False, "None", "Project description is too short. Please explain your approach in detail."

        # 2. Tech Stack Consistency Check
        # Does the description or tech stack mention the skill?
        skill_name = project_data.get('skill_name', '').lower()
        combined_text = (desc + " " + techs).lower()
        
        if skill_name not in combined_text and skill_name not in techs.lower():
             return False, "None", f"The project description does not seem to mention {project_data['skill_name']}."
             
        # 3. Code/Demo Proof Check
        if not github and not project_data.get('demo_link'):
            return False, "None", "Please provide a valid GitHub repository or Demo link to verify your work."
            
        # 4. Simulated Badge Assignment (based on depth/keywords)
        keywords_expert = ["architecture", "scaling", "microservices", "optimization", "deployed", "ci/cd"]
        keywords_inter = ["api", "database", "authentication", "state management", "responsive"]
        
        score = 0
        if any(k in combined_text for k in keywords_expert): score += 3
        if any(k in combined_text for k in keywords_inter): score += 2
        
        # Base score from having a repo
        if github: score += 2
        
        if score >= 5:
            return True, "Expert", "Excellent project demonstrating advanced concepts."
        elif score >= 3:
            return True, "Intermediate", "Solid project with good implementation."
        else:
            return True, "Beginner", "Good start. Keep building more complex features."


    def find_matches(self, query: str, candidates: list):
        """
        candidates: List of User objects or dicts (must have 'id', 'skills_offered', 'name', 'reputation_score')
        """
        if not candidates:
            return []

        # 1. Prepare documents (skills list -> string)
        docs = []
        valid_indices = []
        for i, u in enumerate(candidates):
            try:
                # Handle None or non-string (though defined as str in model)
                if not u.skills_offered:
                     skills_list = []
                else:
                    skills_list = json.loads(u.skills_offered)
                docs.append(", ".join(skills_list))
                valid_indices.append(i)
            except Exception:
                # Skip candidate if skills are corrupt
                continue
        
        # Filter candidates to only valid ones
        candidates = [candidates[i] for i in valid_indices]
        
        # 2. Add query to fit (simple approach)
        def text_to_vec(text):
            words = text.lower().replace(',', ' ').split()
            # Simple stop words removal
            stopwords = {'and', 'or', 'the', 'a', 'in', 'of', 'for', 'with', 'to'}
            words = [w for w in words if w not in stopwords]
            return collections.Counter(words)

        def cosine_sim(vec1, vec2):
            intersection = set(vec1.keys()) & set(vec2.keys())
            numerator = sum([vec1[x] * vec2[x] for x in intersection])
            sum1 = sum([vec1[x] ** 2 for x in list(vec1.keys())])
            sum2 = sum([vec2[x] ** 2 for x in list(vec2.keys())])
            denominator = math.sqrt(sum1) * math.sqrt(sum2)
            if not denominator:
                return 0.0
            return float(numerator) / denominator

        query_vec = text_to_vec(query)
        
        # 3. Calculate Cosine Similarity & Rank
        results = []
        for i, doc in enumerate(docs):
            doc_vec = text_to_vec(doc)
            score = cosine_sim(query_vec, doc_vec)
            if score > 0.05: # Lowered threshold slightly for better discovery
                user = candidates[i]
                
                # --- NEW: Badge Weighting ---
                badge_weight = 1.0
                try:
                    badges = json.loads(user.badges) if isinstance(user.badges, str) else user.badges
                    # If any skill matches the query (even partially) and has a badge, boost it
                    for skill, level in badges.items():
                        if skill.lower() in query.lower() or query.lower() in skill.lower():
                            if level == "Expert": badge_weight = max(badge_weight, 1.3)
                            elif level == "Intermediate": badge_weight = max(badge_weight, 1.15)
                            elif level == "Beginner": badge_weight = max(badge_weight, 1.05)
                except (json.JSONDecodeError, TypeError, AttributeError):
                    pass

                # Basic Reputation Weighting
                rep_weight = 1.0 + (user.reputation_score / 10.0) # Boost by up to 0.5
                
                final_score = score * rep_weight * badge_weight
                
                results.append({
                    "user": user,
                    "similarity": score,
                    "match_score": final_score
                })
        
        results.sort(key=lambda x: x['match_score'], reverse=True)
        return results

    def generate_feedback_summary(self, reviews: List[str]) -> str:
        """
        Simulates AI summarization of feedback comments.
        """
        if not reviews:
            return "No feedback yet."
            
        keywords = ["clear", "patient", "expert", "structured", "fun", "knowledgeable", "helpful"]
        found = [k for k in keywords if any(k in r.lower() for r in reviews)]
        found = list(set(found)) # Dedup
        
        if not found:
            return "Learners typically report positive sessions."
            
        trait_str = ", ".join(found[:3])
        return f"Learners appreciate the {trait_str} teaching style."

    def generate_learning_path(self, skill: str) -> List[dict]:
        """
        Returns a structured learning path for a given skill.
        """
        skill_lower = skill.lower()
        
        if "react" in skill_lower:
            return [
                {"step": 1, "topic": "HTML & CSS Basics", "desc": "Structure and Style"},
                {"step": 2, "topic": "JavaScript Fundamentals", "desc": "ES6+, Async/Await"},
                {"step": 3, "topic": "React Core", "desc": "Components, Props, State"},
                {"step": 4, "topic": "Hooks & Effects", "desc": "useState, useEffect"},
                {"step": 5, "topic": "Routing & State Mgt", "desc": "React Router, Context API"}
            ]
        elif "python" in skill_lower:
             return [
                {"step": 1, "topic": "Syntax Basics", "desc": "Variables, Loops, Functions"},
                {"step": 2, "topic": "Data Structures", "desc": "Lists, Dicts, Sets"},
                {"step": 3, "topic": "OOP", "desc": "Classes, Inheritance"},
                {"step": 4, "topic": "Libraries", "desc": "Requests, Pandas, NumPy"},
                {"step": 5, "topic": "Web Frameworks", "desc": "Flask or FastAPI"}
            ]
        else:
            # Generic
            return [
                 {"step": 1, "topic": "Foundations", "desc": f"Basic concepts of {skill}"},
                 {"step": 2, "topic": "Intermediate Techniques", "desc": "Applied practice"},
                 {"step": 3, "topic": "Advanced Application", "desc": "Real-world projects"},
                 {"step": 4, "topic": "Mastery", "desc": "Complex problem solving"}
            ]
