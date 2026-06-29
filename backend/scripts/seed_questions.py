"""Seed database with 1000+ interview questions."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.subject import Subject, Question


SAMPLE_QUESTIONS = {
    "Python": [
        {
            "type": "theory",
            "difficulty": "easy",
            "question_text": "What is the difference between a list and a tuple in Python?",
            "correct_answer": "Lists are mutable (can be modified), tuples are immutable (cannot be modified after creation). Tuples are faster and can be used as dictionary keys.",
            "options": [
                "Lists are mutable, tuples are immutable",
                "Lists are immutable, tuples are mutable",
                "They are exactly the same",
                "Lists are slower than tuples"
            ],
            "tags": ["basics", "data-structures"]
        },
        {
            "type": "theory",
            "difficulty": "medium",
            "question_text": "Explain the Global Interpreter Lock (GIL) in Python.",
            "correct_answer": "The GIL is a mechanism in CPython that allows only one thread to execute Python bytecode at a time. This prevents true parallelism with threads but protects memory management. It can be worked around using multiprocessing or alternative interpreters like Jython or IronPython.",
            "options": [
                "It prevents multiple threads from running simultaneously",
                "It improves thread performance dramatically",
                "It is unique to Python",
                "It only affects async code"
            ],
            "tags": ["threading", "concurrency", "advanced"]
        },
        {
            "type": "coding",
            "difficulty": "medium",
            "question_text": "Write a function to reverse a string without using slicing.",
            "correct_answer": "def reverse_string(s):\n    result = ''\n    for char in s:\n        result = char + result\n    return result",
            "options": None,
            "tags": ["strings", "loops"]
        },
    ],
    "SQL": [
        {
            "type": "theory",
            "difficulty": "easy",
            "question_text": "What is the difference between INNER JOIN and LEFT JOIN?",
            "correct_answer": "INNER JOIN returns only rows that have matching values in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right table, with NULLs for non-matching rows.",
            "options": [
                "INNER JOIN: only matching rows; LEFT JOIN: all left table rows",
                "They are the same",
                "LEFT JOIN is faster than INNER JOIN",
                "INNER JOIN returns all rows from left table"
            ],
            "tags": ["joins", "basics"]
        },
        {
            "type": "theory",
            "difficulty": "hard",
            "question_text": "Explain the difference between WHERE and HAVING clauses.",
            "correct_answer": "WHERE filters rows before grouping (on individual rows). HAVING filters rows after grouping (on aggregated results). WHERE cannot use aggregate functions, but HAVING can.",
            "options": [
                "WHERE filters before grouping, HAVING filters after grouping",
                "WHERE and HAVING are interchangeable",
                "HAVING can only be used without GROUP BY",
                "WHERE is used with joins, HAVING with subqueries"
            ],
            "tags": ["aggregation", "advanced"]
        },
    ],
    "Excel": [
        {
            "type": "theory",
            "difficulty": "easy",
            "question_text": "What is the difference between absolute and relative cell references?",
            "correct_answer": "Relative references (A1) change when copied to other cells. Absolute references ($A$1) stay the same when copied. Mixed references ($A1 or A$1) freeze either the column or row.",
            "options": [
                "Absolute references don't change when copied, relative references do",
                "They are the same thing",
                "Relative references are for formulas, absolute for values",
                "Absolute references are slower"
            ],
            "tags": ["formulas", "basics"]
        },
    ],
    "Machine Learning": [
        {
            "type": "theory",
            "difficulty": "medium",
            "question_text": "What is overfitting and how can you prevent it?",
            "correct_answer": "Overfitting occurs when a model learns training data too well, including noise, causing poor generalization. Prevention: use regularization (L1/L2), cross-validation, early stopping, data augmentation, and ensemble methods.",
            "options": [
                "When model performs too well on training data",
                "When model is too simple",
                "When features are not normalized",
                "When sample size is too large"
            ],
            "tags": ["model-selection", "validation"]
        },
    ],
    "HR Interview": [
        {
            "type": "theory",
            "difficulty": "easy",
            "question_text": "Tell me about yourself.",
            "correct_answer": "Briefly introduce yourself with relevant professional background, key achievements, and why you're interested in the role. Keep it to 2-3 minutes with specific examples.",
            "options": None,
            "tags": ["introduction", "behavioral"]
        },
        {
            "type": "theory",
            "difficulty": "medium",
            "question_text": "Describe a situation where you had to handle conflict in a team.",
            "correct_answer": "Use STAR method: Situation (context), Task (what was needed), Action (what you did), Result (what happened). Focus on resolution, learning, and positive outcomes.",
            "options": None,
            "tags": ["behavioral", "conflict-resolution"]
        },
    ],
}


async def seed_questions():
    """Seed questions from sample data."""
    async with AsyncSessionLocal() as session:
        # Get all subjects
        result = await session.execute(select(Subject))
        subjects = result.scalars().all()
        subject_map = {s.name: s for s in subjects}

        # Count existing questions
        result = await session.execute(select(Question))
        existing = result.scalars().all()
        
        if len(existing) > 0:
            print(f"✓ Questions already seeded ({len(existing)} questions). Skipping.")
            return

        total_added = 0
        
        for subject_name, questions_list in SAMPLE_QUESTIONS.items():
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
                    tags=q_data["tags"]
                )
                session.add(question)
                total_added += 1

        await session.commit()
        print(f"✓ Seeded {total_added} sample questions")
        print("\nNote: To add all 1000+ questions:")
        print("  1. Prepare CSV file: question_text, type, difficulty, correct_answer, options, tags, subject")
        print("  2. Use: python scripts/bulk_import_questions.py --csv /path/to/questions.csv")


async def main():
    """Main entry point."""
    print("🌱 Seeding sample questions...")
    try:
        await seed_questions()
        print("✓ Question seeding completed successfully")
    except Exception as e:
        print(f"✗ Error seeding questions: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
