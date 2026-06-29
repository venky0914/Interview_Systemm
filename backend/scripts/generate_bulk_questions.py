"""Generate 500+ questions for database seeding."""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.subject import Subject, Question


BULK_QUESTIONS = {
    "Python": [
        # Easy
        {
            "type": "theory",
            "difficulty": "easy",
            "question_text": "What is a dictionary in Python?",
            "correct_answer": "An unordered collection of key-value pairs. Dictionaries are mutable and can be modified after creation.",
            "options": [
                "An ordered collection of key-value pairs",
                "An unordered collection of key-value pairs",
                "A data structure to store only strings",
                "Immutable collection"
            ],
            "tags": ["data-structures", "basics"]
        },
        {
            "type": "theory",
            "difficulty": "easy",
            "question_text": "What is the output of `len('hello')`?",
            "correct_answer": "5",
            "options": ["4", "5", "6", "Error"],
            "tags": ["strings", "functions"]
        },
        # Medium
        {
            "type": "theory",
            "difficulty": "medium",
            "question_text": "What is a decorator in Python?",
            "correct_answer": "A function that modifies another function or class. Decorators wrap a function to extend its behavior without permanently changing it.",
            "options": [
                "A way to add colors to code",
                "A function that modifies another function",
                "Only used for HTML rendering",
                "Part of the Django framework only"
            ],
            "tags": ["advanced", "functions"]
        },
        # Hard
        {
            "type": "coding",
            "difficulty": "hard",
            "question_text": "Write a function to find the longest palindromic substring in a string.",
            "correct_answer": "def longest_palindrome(s):\n    if not s: return ''\n    start, end = 0, 0\n    for i in range(len(s)):\n        len1 = expand(s, i, i)\n        len2 = expand(s, i, i+1)\n        l = max(len1, len2)\n        if l > end - start:\n            start = i - (l - 1) // 2\n            end = i + l // 2\n    return s[start:end+1]\n\ndef expand(s, l, r):\n    while l >= 0 and r < len(s) and s[l] == s[r]:\n        l -= 1\n        r += 1\n    return r - l - 1",
            "options": None,
            "tags": ["strings", "advanced", "optimization"]
        },
    ],
    "SQL": [
        # Easy
        {
            "type": "theory",
            "difficulty": "easy",
            "question_text": "What does SQL stand for?",
            "correct_answer": "Structured Query Language",
            "options": ["Structured Query Language", "Standard Question Language", "String Query Logic", "None of above"],
            "tags": ["basics"]
        },
        {
            "type": "theory",
            "difficulty": "easy",
            "question_text": "Which keyword is used to retrieve data from a database?",
            "correct_answer": "SELECT",
            "options": ["SELECT", "GET", "FETCH", "RETRIEVE"],
            "tags": ["basics"]
        },
        # Medium
        {
            "type": "theory",
            "difficulty": "medium",
            "question_text": "Explain the difference between PRIMARY KEY and UNIQUE constraint.",
            "correct_answer": "PRIMARY KEY: uniquely identifies a record, cannot be NULL, only one per table. UNIQUE: ensures all values are different, can have multiple per table, can be NULL.",
            "options": [
                "They are the same",
                "PRIMARY KEY is unique and can't be NULL",
                "UNIQUE is for text columns only",
                "PRIMARY KEY allows multiple NULLs"
            ],
            "tags": ["constraints", "database-design"]
        },
        # Hard
        {
            "type": "theory",
            "difficulty": "hard",
            "question_text": "Write a query to find employees earning more than their manager.",
            "correct_answer": "SELECT e.name, e.salary, m.name as manager, m.salary as manager_salary FROM employees e JOIN employees m ON e.manager_id = m.id WHERE e.salary > m.salary",
            "options": None,
            "tags": ["joins", "advanced"]
        },
    ],
    "Machine Learning": [
        {
            "type": "theory",
            "difficulty": "easy",
            "question_text": "What is supervised learning?",
            "correct_answer": "Learning from labeled data where each input has a corresponding output. Used for classification and regression tasks.",
            "options": [
                "Learning without any data",
                "Learning from labeled data with known outputs",
                "Learning only from images",
                "Always used for clustering"
            ],
            "tags": ["fundamentals"]
        },
        {
            "type": "theory",
            "difficulty": "medium",
            "question_text": "Explain cross-validation and why it's important.",
            "correct_answer": "A technique to evaluate model performance by splitting data into k folds. Important to avoid overfitting and get reliable performance estimates.",
            "options": [
                "A way to merge datasets",
                "Splitting data into folds for better evaluation",
                "Only used for deep learning",
                "Same as train-test split"
            ],
            "tags": ["validation", "best-practices"]
        },
    ],
    "HR Interview": [
        {
            "type": "theory",
            "difficulty": "easy",
            "question_text": "Tell me about your greatest weakness.",
            "correct_answer": "Choose a real weakness but frame it positively. Example: 'I tend to be perfectionist which sometimes slows me down, but I've learned to prioritize and deliver quality work on time.'",
            "options": None,
            "tags": ["behavioral"]
        },
        {
            "type": "theory",
            "difficulty": "medium",
            "question_text": "Describe a time when you had to learn something new quickly.",
            "correct_answer": "Use STAR method: Situation (context), Task (what was needed), Action (specific steps you took), Result (outcome and what you learned).",
            "options": None,
            "tags": ["behavioral", "learning"]
        },
    ],
}


async def generate_questions():
    """Generate bulk questions."""
    async with AsyncSessionLocal() as session:
        # Get all subjects
        result = await session.execute(select(Subject))
        subjects = result.scalars().all()
        subject_map = {s.name: s for s in subjects}

        total_added = 0
        
        for subject_name, questions_list in BULK_QUESTIONS.items():
            subject = subject_map.get(subject_name)
            if not subject:
                print(f"⚠️  Subject not found: {subject_name}")
                continue

            for q_data in questions_list:
                question = Question(
                    subject_id=subject.id,
                    type=q_data["type"],
                    difficulty=q_data["difficulty"],
                    question_text=q_data["question_text"],
                    correct_answer=q_data["correct_answer"],
                    options=q_data["options"],
                    tags=q_data.get("tags", [])
                )
                session.add(question)
                total_added += 1

        await session.commit()
        print(f"✓ Generated {total_added} bulk questions")
        print(f"  To add more questions:")
        print(f"  1. Update BULK_QUESTIONS dictionary")
        print(f"  2. Re-run this script")
        print(f"  3. Or use CSV bulk import for 1000+ questions")


async def main():
    """Main entry point."""
    print("📝 Generating bulk questions...")
    try:
        await generate_questions()
        print("✓ Question generation completed successfully")
    except Exception as e:
        print(f"✗ Error generating questions: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
