import random

class QuizGenerator:
    def __init__(self):
        # Expanded Question Banks (15+ per skill to ensure variety when picking 10)
        self.question_banks = {
            "python": [
                {"q": "What is the output of print(2 ** 3)?", "options": ["6", "8", "9", "5"], "answer": "8"},
                {"q": "Which keyword is used to define a function?", "options": ["func", "def", "definition", "function"], "answer": "def"},
                {"q": "What data type is [1, 2, 3]?", "options": ["Tuple", "List", "Dictionary", "Set"], "answer": "List"},
                {"q": "How do you start a for loop?", "options": ["for x in y:", "loop x in y", "for each x in y", "x.loop()"], "answer": "for x in y:"},
                {"q": "What is the result of 'a' + 'b'?", "options": ["ab", "a+b", "Error", "None"], "answer": "ab"},
                {"q": "Which is immutable?", "options": ["List", "Dictionary", "Set", "Tuple"], "answer": "Tuple"},
                {"q": "What does `len()` return?", "options": ["Length", "Last Item", "First Item", "Loop"], "answer": "Length"},
                {"q": "How to comment in Python?", "options": ["//", "#", "/* */", "<!-- -->"], "answer": "#"},
                {"q": "Keyword for infinite loop?", "options": ["forever", "while True:", "loop:", "infinite"], "answer": "while True:"},
                {"q": "Output of `bool([])`?", "options": ["True", "False", "Error", "None"], "answer": "False"},
                {"q": "Correct way to import?", "options": ["import math", "include math", "using math", "load math"], "answer": "import math"},
                {"q": "What is `None`?", "options": ["Zero", "Null value", "Empty String", "False"], "answer": "Null value"},
                {"q": "Method to add to set?", "options": ["add()", "append()", "push()", "insert()"], "answer": "add()"},
                {"q": "Which is not a keyword?", "options": ["eval", "pass", "assert", "lambda"], "answer": "eval"},
                {"q": "Operator for integer division?", "options": ["/", "//", "%", "#"], "answer": "//"}
            ],
            "react": [
                {"q": "Which hook is used for side effects?", "options": ["useState", "useEffect", "useContext", "useReducer"], "answer": "useEffect"},
                {"q": "How do you pass data to child components?", "options": ["State", "Props", "Context", "Redux"], "answer": "Props"},
                {"q": "What is JSX?", "options": ["Java XML", "JavaScript XML", "JSON XML", "Java Syntax"], "answer": "JavaScript XML"},
                {"q": "Which method is used to update state?", "options": ["updateState", "setState", "changeState", "modState"], "answer": "setState"},
                {"q": "What is the virtual DOM?", "options": ["A virus", "A lightweight copy of the DOM", "A heavy database", "None"], "answer": "A lightweight copy of the DOM"},
                {"q": "Hook for managing local state?", "options": ["useEffect", "useReducer", "useState", "useMemo"], "answer": "useState"},
                {"q": "Value of reference with `useRef`?", "options": [".value", ".current", ".ref", ".node"], "answer": ".current"},
                {"q": "Purpose of `useMemo`?", "options": ["Memoize values", "Memoize functions", "Side effects", "Routing"], "answer": "Memoize values"},
                {"q": "Default port for React scripts?", "options": ["3000", "8000", "8080", "5000"], "answer": "3000"},
                {"q": "Library for typechecking?", "options": ["PropTypes", "ReactTypes", "CheckTypes", "None"], "answer": "PropTypes"},
                {"q": "Context API avoids?", "options": ["Prop Drilling", "State", "Hooks", "CSS"], "answer": "Prop Drilling"},
                {"q": "Parent of all components?", "options": ["Root", "App", "Main", "Index"], "answer": "App"},
                {"q": "React router hook for parameters?", "options": ["useParams", "useHistory", "useRoute", "useQuery"], "answer": "useParams"},
                {"q": "Which is a Higher Order Component?", "options": ["withRouter", "div", "span", "App"], "answer": "withRouter"},
                {"q": "Attribute for list rendering?", "options": ["id", "key", "index", "ref"], "answer": "key"}
            ],
            "javascript": [
                {"q": "Which is not a primitive type?", "options": ["String", "Number", "Object", "Boolean"], "answer": "Object"},
                {"q": "How do you declare a constant?", "options": ["var", "let", "const", "def"], "answer": "const"},
                {"q": "What is 'NaN'?", "options": ["Not a Number", "Null", "Undefined", "Error"], "answer": "Not a Number"},
                {"q": "Which method adds to array end?", "options": ["push", "pop", "shift", "unshift"], "answer": "push"},
                {"q": "What is ===?", "options": ["Assignment", "Equality", "Strict Equality", "Inequality"], "answer": "Strict Equality"},
                {"q": "Keyword for current object?", "options": ["self", "this", "me", "object"], "answer": "this"},
                {"q": "Output of `typeof []`?", "options": ["array", "list", "object", "undefined"], "answer": "object"},
                {"q": "Convert string to int?", "options": ["parseInt", "toInt", "parseInteger", "int"], "answer": "parseInt"},
                {"q": "Which is a loop?", "options": ["for", "foreach", "map", "All of above"], "answer": "All of above"},
                {"q": "DOM stands for?", "options": ["Document Object Model", "Data Object Model", "Disk Operating Mode", "None"], "answer": "Document Object Model"},
                {"q": "Default return of function?", "options": ["0", "null", "undefined", "false"], "answer": "undefined"},
                {"q": "Event for clicking?", "options": ["onclick", "onpress", "onhit", "ontouch"], "answer": "onclick"},
                {"q": "JSON stringify does?", "options": ["Parses JSON", "Converts to String", "Formats Code", "Deletes Data"], "answer": "Converts to String"},
                {"q": "Symbol for logical OR?", "options": ["||", "&&", "!", "|"], "answer": "||"},
                {"q": "Async function returns?", "options": ["Value", "Promise", "Error", "Callback"], "answer": "Promise"}
            ],
            "data science": [
                {"q": "What is the purpose of cross-validation?", "options": ["Increase model complexity", "Assess model performance", "Reduce training time", "Visualize data"], "answer": "Assess model performance"},
                {"q": "Which library is used for data manipulation in Python?", "options": ["NumPy", "Pandas", "Matplotlib", "Scikit-learn"], "answer": "Pandas"},
                {"q": "What does 'overfitting' mean?", "options": ["Model is too simple", "Model performs well on training but poorly on test data", "Model has too few features", "Model trains too fast"], "answer": "Model performs well on training but poorly on test data"},
                {"q": "Which metric is used for classification problems?", "options": ["MSE", "RMSE", "Accuracy", "R-squared"], "answer": "Accuracy"},
                {"q": "What is a DataFrame in Pandas?", "options": ["A 1D array", "A 2D labeled data structure", "A dictionary", "A list"], "answer": "A 2D labeled data structure"},
                {"q": "What does 'feature engineering' involve?", "options": ["Creating new features from existing data", "Removing outliers", "Normalizing data", "Splitting data"], "answer": "Creating new features from existing data"},
                {"q": "Which algorithm is used for regression?", "options": ["K-Means", "Decision Tree", "Linear Regression", "K-NN"], "answer": "Linear Regression"},
                {"q": "What is the purpose of normalization?", "options": ["Scale features to a similar range", "Remove duplicates", "Handle missing values", "Encode categorical variables"], "answer": "Scale features to a similar range"},
                {"q": "What is a confusion matrix?", "options": ["A plot of features", "A table showing model predictions vs actual values", "A correlation matrix", "A histogram"], "answer": "A table showing model predictions vs actual values"},
                {"q": "Which library is used for visualization?", "options": ["Pandas", "NumPy", "Matplotlib", "Scikit-learn"], "answer": "Matplotlib"},
                {"q": "What is the purpose of train-test split?", "options": ["Increase data size", "Evaluate model on unseen data", "Remove outliers", "Normalize data"], "answer": "Evaluate model on unseen data"},
                {"q": "What is a hyperparameter?", "options": ["A parameter learned during training", "A parameter set before training", "A feature in the dataset", "An output variable"], "answer": "A parameter set before training"},
                {"q": "Which method handles missing values?", "options": ["Imputation", "Normalization", "Encoding", "Splitting"], "answer": "Imputation"},
                {"q": "What is the purpose of PCA?", "options": ["Classification", "Dimensionality reduction", "Clustering", "Regression"], "answer": "Dimensionality reduction"},
                {"q": "What is ensemble learning?", "options": ["Using a single model", "Combining multiple models", "Feature selection", "Data augmentation"], "answer": "Combining multiple models"}
            ],
            "cloud": [
                {"q": "What does EC2 stand for in AWS?", "options": ["Elastic Compute Cloud", "Elastic Container Cloud", "Easy Compute Cloud", "Elastic Cloud Computing"], "answer": "Elastic Compute Cloud"},
                {"q": "Which AWS service is used for object storage?", "options": ["EBS", "S3", "RDS", "DynamoDB"], "answer": "S3"},
                {"q": "What is the purpose of a VPC?", "options": ["Store data", "Isolate network resources", "Run containers", "Manage databases"], "answer": "Isolate network resources"},
                {"q": "Which service is used for serverless computing?", "options": ["EC2", "Lambda", "ECS", "Fargate"], "answer": "Lambda"},
                {"q": "What is IAM in AWS?", "options": ["Identity and Access Management", "Internet Access Manager", "Instance Access Module", "Image Access Manager"], "answer": "Identity and Access Management"},
                {"q": "Which service is used for DNS management?", "options": ["CloudFront", "Route 53", "API Gateway", "ELB"], "answer": "Route 53"},
                {"q": "What is the purpose of CloudWatch?", "options": ["Store logs", "Monitor resources", "Deploy applications", "Manage databases"], "answer": "Monitor resources"},
                {"q": "Which service is used for container orchestration?", "options": ["ECS", "S3", "RDS", "Lambda"], "answer": "ECS"},
                {"q": "What is the purpose of an Elastic Load Balancer?", "options": ["Store data", "Distribute traffic across instances", "Run containers", "Manage DNS"], "answer": "Distribute traffic across instances"},
                {"q": "Which service is used for relational databases?", "options": ["DynamoDB", "S3", "RDS", "Redshift"], "answer": "RDS"},
                {"q": "What is the purpose of CloudFront?", "options": ["Content delivery network", "Database management", "Container orchestration", "Serverless computing"], "answer": "Content delivery network"},
                {"q": "Which service is used for NoSQL databases?", "options": ["RDS", "DynamoDB", "S3", "Redshift"], "answer": "DynamoDB"},
                {"q": "What is the purpose of Auto Scaling?", "options": ["Store data", "Automatically adjust capacity", "Manage DNS", "Deploy applications"], "answer": "Automatically adjust capacity"},
                {"q": "Which service is used for message queuing?", "options": ["SNS", "SQS", "S3", "Lambda"], "answer": "SQS"},
                {"q": "What is the purpose of Elastic Beanstalk?", "options": ["Deploy and manage applications", "Store objects", "Run containers", "Manage databases"], "answer": "Deploy and manage applications"}
            ],
            "devops": [
                {"q": "What is CI/CD?", "options": ["Continuous Integration/Continuous Deployment", "Cloud Integration/Cloud Deployment", "Container Integration/Container Deployment", "Code Integration/Code Deployment"], "answer": "Continuous Integration/Continuous Deployment"},
                {"q": "Which tool is used for containerization?", "options": ["Jenkins", "Docker", "Ansible", "Terraform"], "answer": "Docker"},
                {"q": "What is the purpose of Kubernetes?", "options": ["Version control", "Container orchestration", "Configuration management", "Continuous integration"], "answer": "Container orchestration"},
                {"q": "Which tool is used for infrastructure as code?", "options": ["Docker", "Jenkins", "Terraform", "Git"], "answer": "Terraform"},
                {"q": "What is the purpose of Jenkins?", "options": ["Container orchestration", "Continuous integration", "Configuration management", "Monitoring"], "answer": "Continuous integration"},
                {"q": "Which tool is used for configuration management?", "options": ["Docker", "Ansible", "Git", "Kubernetes"], "answer": "Ansible"},
                {"q": "What is the purpose of a Docker image?", "options": ["Run containers", "Package application and dependencies", "Manage infrastructure", "Monitor resources"], "answer": "Package application and dependencies"},
                {"q": "Which tool is used for version control?", "options": ["Jenkins", "Docker", "Git", "Ansible"], "answer": "Git"},
                {"q": "What is the purpose of a load balancer?", "options": ["Store data", "Distribute traffic", "Run containers", "Manage code"], "answer": "Distribute traffic"},
                {"q": "Which tool is used for monitoring?", "options": ["Prometheus", "Docker", "Git", "Terraform"], "answer": "Prometheus"},
                {"q": "What is the purpose of a pipeline?", "options": ["Store code", "Automate build, test, and deploy", "Monitor resources", "Manage containers"], "answer": "Automate build, test, and deploy"},
                {"q": "Which tool is used for log aggregation?", "options": ["Docker", "ELK Stack", "Git", "Jenkins"], "answer": "ELK Stack"},
                {"q": "What is the purpose of blue-green deployment?", "options": ["Reduce downtime during deployment", "Increase storage", "Monitor resources", "Manage containers"], "answer": "Reduce downtime during deployment"},
                {"q": "Which tool is used for secret management?", "options": ["Docker", "Vault", "Git", "Jenkins"], "answer": "Vault"},
                {"q": "What is the purpose of a Dockerfile?", "options": ["Define container image", "Manage infrastructure", "Monitor resources", "Store code"], "answer": "Define container image"}
            ],
            "machine learning": [
                {"q": "What is supervised learning?", "options": ["Learning with labeled data", "Learning without labels", "Learning with reinforcement", "Learning with clustering"], "answer": "Learning with labeled data"},
                {"q": "Which algorithm is used for classification?", "options": ["K-Means", "Linear Regression", "Decision Tree", "PCA"], "answer": "Decision Tree"},
                {"q": "What is the purpose of gradient descent?", "options": ["Classify data", "Optimize model parameters", "Cluster data", "Reduce dimensions"], "answer": "Optimize model parameters"},
                {"q": "Which metric is used for regression?", "options": ["Accuracy", "Precision", "MSE", "F1-Score"], "answer": "MSE"},
                {"q": "What is overfitting?", "options": ["Model is too simple", "Model memorizes training data", "Model has too few features", "Model trains too fast"], "answer": "Model memorizes training data"},
                {"q": "Which algorithm is used for clustering?", "options": ["Linear Regression", "K-Means", "Logistic Regression", "SVM"], "answer": "K-Means"},
                {"q": "What is the purpose of regularization?", "options": ["Increase model complexity", "Prevent overfitting", "Speed up training", "Visualize data"], "answer": "Prevent overfitting"},
                {"q": "Which is a neural network activation function?", "options": ["MSE", "ReLU", "Accuracy", "Gradient"], "answer": "ReLU"},
                {"q": "What is the purpose of cross-validation?", "options": ["Split data", "Evaluate model performance", "Train faster", "Reduce features"], "answer": "Evaluate model performance"},
                {"q": "Which algorithm is used for dimensionality reduction?", "options": ["K-Means", "PCA", "Decision Tree", "SVM"], "answer": "PCA"},
                {"q": "What is the purpose of a confusion matrix?", "options": ["Visualize features", "Evaluate classification performance", "Normalize data", "Split data"], "answer": "Evaluate classification performance"},
                {"q": "Which is an ensemble learning method?", "options": ["Linear Regression", "Random Forest", "K-Means", "PCA"], "answer": "Random Forest"},
                {"q": "What is the purpose of feature scaling?", "options": ["Remove outliers", "Normalize feature ranges", "Encode categories", "Split data"], "answer": "Normalize feature ranges"},
                {"q": "Which algorithm is used for anomaly detection?", "options": ["Linear Regression", "Isolation Forest", "K-Means", "Decision Tree"], "answer": "Isolation Forest"},
                {"q": "What is transfer learning?", "options": ["Training from scratch", "Using pre-trained models", "Clustering data", "Reducing dimensions"], "answer": "Using pre-trained models"}
            ],
            "ui/ux": [
                {"q": "What does UX stand for?", "options": ["User Experience", "User Exchange", "Universal Experience", "Unique Experience"], "answer": "User Experience"},
                {"q": "What is the purpose of a wireframe?", "options": ["Final design", "Low-fidelity layout sketch", "Color palette", "Typography guide"], "answer": "Low-fidelity layout sketch"},
                {"q": "Which principle emphasizes visual hierarchy?", "options": ["Contrast", "Alignment", "Proximity", "All of above"], "answer": "All of above"},
                {"q": "What is the purpose of a persona?", "options": ["Design colors", "Represent target users", "Create layouts", "Test prototypes"], "answer": "Represent target users"},
                {"q": "Which tool is used for prototyping?", "options": ["Photoshop", "Figma", "Excel", "Word"], "answer": "Figma"},
                {"q": "What is the F-pattern in web design?", "options": ["Font style", "Eye-tracking reading pattern", "Color scheme", "Layout grid"], "answer": "Eye-tracking reading pattern"},
                {"q": "What is the purpose of A/B testing?", "options": ["Compare design variations", "Create wireframes", "Design colors", "Write code"], "answer": "Compare design variations"},
                {"q": "Which color theory principle creates harmony?", "options": ["Complementary colors", "Random colors", "Single color", "Black and white"], "answer": "Complementary colors"},
                {"q": "What is the purpose of white space?", "options": ["Fill empty areas", "Improve readability and focus", "Waste space", "Add borders"], "answer": "Improve readability and focus"},
                {"q": "Which principle ensures accessibility?", "options": ["WCAG", "RGB", "CMYK", "HTML"], "answer": "WCAG"},
                {"q": "What is the purpose of a style guide?", "options": ["Write code", "Maintain design consistency", "Create wireframes", "Test prototypes"], "answer": "Maintain design consistency"},
                {"q": "Which is a mobile-first design approach?", "options": ["Design for desktop first", "Design for mobile first", "Design for tablet first", "Design for all at once"], "answer": "Design for mobile first"},
                {"q": "What is the purpose of user testing?", "options": ["Write code", "Validate design decisions", "Create wireframes", "Choose colors"], "answer": "Validate design decisions"},
                {"q": "Which principle improves usability?", "options": ["Consistency", "Randomness", "Complexity", "Ambiguity"], "answer": "Consistency"},
                {"q": "What is the purpose of a mood board?", "options": ["Write code", "Establish visual direction", "Test prototypes", "Create layouts"], "answer": "Establish visual direction"}
            ]
        }
        
    def generate_quiz(self, skill: str, num_questions: int = 5):
        """Generate quiz with specified number of questions (default 5 for backward compatibility)"""
        skill_key = skill.lower()
        questions = []
        
        if skill_key in self.question_banks:
             pool = self.question_banks[skill_key]
             questions = random.sample(pool, min(num_questions, len(pool)))
        else:
            # Enhanced Dynamic Fallback
            templates = [
                {"q": f"What is a core principle of {skill}?", "options": ["Abstraction", "Compilation", "Execution", "Validation"], "answer": "Abstraction"},
                {"q": f"Which tool is commonly associated with {skill}?", "options": ["VS Code", "Eclipse", "Notepad", "Excel"], "answer": "VS Code"},
                {"q": f"Level of difficulty for {skill}?", "options": ["Beginner", "Intermediate", "Advanced", "Expert"], "answer": "Intermediate"},
                {"q": f"Community verification for {skill}?", "options": ["GitHub", "StackOverflow", "Reddit", "LinkedIn"], "answer": "GitHub"},
                {"q": f"Standard file extension for {skill}?", "options": [".txt", ".bin", ".src", ".code"], "answer": ".src"},
                {"q": f"Primary use case for {skill}?", "options": ["Web Dev", "Data Science", "System Admin", "Design"], "answer": "Web Dev"},
                {"q": f"Is {skill} open source?", "options": ["Yes", "No", "Partially", "Unknown"], "answer": "Yes"},
                {"q": f"Year {skill} was popularized?", "options": ["1990s", "2000s", "2010s", "2020s"], "answer": "2010s"},
                {"q": f"Best resource to learn {skill}?", "options": ["Documentation", "YouTube", "Books", "All of above"], "answer": "All of above"},
                {"q": f"Is {skill} in demand?", "options": ["Yes", "No", "Maybe", "Unknown"], "answer": "Yes"}
            ]
            questions = random.sample(templates, min(num_questions, len(templates)))

        # Shuffle Options for every question
        final_questions = []
        for q in questions:
            opts = q["options"][:] # Copy
            random.shuffle(opts)
            final_questions.append({
                "q": q["q"],
                "options": opts,
                "answer": q["answer"]
            })
            
        return final_questions
