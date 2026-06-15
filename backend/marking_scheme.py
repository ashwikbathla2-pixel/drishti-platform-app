"""CBSE Class 12 Business Studies — 80 mark marking scheme (the reference).

The architecture is subject-pluggable: a scheme is just data. Swap this list to
grade a different subject.
"""
from typing import List, Dict, Optional
from pydantic import BaseModel


class SchemeQuestion(BaseModel):
    q_no: str
    section: str  # 'A'|'B'|'C'|'D'|'E'
    type: str     # 'mcq'|'one_word'|'short'|'long'|'case'
    marks: int
    question: str
    options: Optional[Dict[str, str]] = None
    answer: Optional[str] = None          # OBJECTIVE -> exact-match grading
    key_points: Optional[List[str]] = None  # DESCRIPTIVE -> partial-credit rubric


# --- Section A : 20 x 1 mark objective ---------------------------------------
SECTION_A = [
    SchemeQuestion(q_no="Q1", section="A", type="mcq", marks=1,
        question="Which function of management is concerned with 'thinking before doing'?",
        options={"a": "Organising", "b": "Planning", "c": "Staffing", "d": "Controlling"},
        answer="b"),
    SchemeQuestion(q_no="Q2", section="A", type="one_word", marks=1,
        question="Name the principle of management given by Fayol which states there should be one head for one plan.",
        answer="Unity of Direction"),
    SchemeQuestion(q_no="Q3", section="A", type="mcq", marks=1,
        question="The technique of scientific management which differentiates between efficient and inefficient workers is:",
        options={"a": "Functional foremanship", "b": "Method study", "c": "Differential piece wage", "d": "Fatigue study"},
        answer="c"),
    SchemeQuestion(q_no="Q4", section="A", type="one_word", marks=1,
        question="Which dimension of business environment includes Money supply, interest rates and inflation?",
        answer="Economic Environment"),
    SchemeQuestion(q_no="Q5", section="A", type="mcq", marks=1,
        question="Process of grouping activities and establishing authority relationships is called:",
        options={"a": "Planning", "b": "Staffing", "c": "Organising", "d": "Directing"},
        answer="c"),
    SchemeQuestion(q_no="Q6", section="A", type="mcq", marks=1,
        question="Assertion (A): Delegation reduces the work load of a manager. Reason (R): Delegation means transfer of authority. Choose correct option.",
        options={"a": "Both A and R true and R is correct explanation of A", "b": "Both true but R not explanation", "c": "A true R false", "d": "A false R true"},
        answer="a"),
    SchemeQuestion(q_no="Q7", section="A", type="one_word", marks=1,
        question="Name the source of recruitment that boosts morale of existing employees.",
        answer="Internal Source"),
    SchemeQuestion(q_no="Q8", section="A", type="mcq", marks=1,
        question="According to Maslow, which need comes immediately after physiological needs?",
        options={"a": "Esteem", "b": "Safety", "c": "Social", "d": "Self actualisation"},
        answer="b"),
    SchemeQuestion(q_no="Q9", section="A", type="mcq", marks=1,
        question="Which is a non-financial incentive?",
        options={"a": "Bonus", "b": "Profit sharing", "c": "Job security", "d": "Co-partnership"},
        answer="c"),
    SchemeQuestion(q_no="Q10", section="A", type="one_word", marks=1,
        question="The last function in the process of management which measures actual performance against standards.",
        answer="Controlling"),
    SchemeQuestion(q_no="Q11", section="A", type="mcq", marks=1,
        question="Which of the following is NOT a money market instrument?",
        options={"a": "Treasury Bill", "b": "Commercial Paper", "c": "Equity Share", "d": "Call Money"},
        answer="c"),
    SchemeQuestion(q_no="Q12", section="A", type="one_word", marks=1,
        question="Capital required for day-to-day operations of business is called?",
        answer="Working Capital"),
    SchemeQuestion(q_no="Q13", section="A", type="mcq", marks=1,
        question="The regulator of securities market in India is:",
        options={"a": "RBI", "b": "SEBI", "c": "IRDA", "d": "AMFI"},
        answer="b"),
    SchemeQuestion(q_no="Q14", section="A", type="mcq", marks=1,
        question="'Product, Price, Place, Promotion' together are known as:",
        options={"a": "Marketing Mix", "b": "Promotion Mix", "c": "Product Mix", "d": "Market Plan"},
        answer="a"),
    SchemeQuestion(q_no="Q15", section="A", type="one_word", marks=1,
        question="The element of marketing mix that is the only revenue generating element.",
        answer="Price"),
    SchemeQuestion(q_no="Q16", section="A", type="mcq", marks=1,
        question="Under the Consumer Protection Act 2019, the pecuniary jurisdiction of District Commission is up to:",
        options={"a": "Rs 50 lakh", "b": "Rs 1 crore", "c": "Rs 2 crore", "d": "Rs 10 crore"},
        answer="b"),
    SchemeQuestion(q_no="Q17", section="A", type="mcq", marks=1,
        question="Which principle of Fayol emphasises 'a place for everything and everything in its place'?",
        options={"a": "Order", "b": "Equity", "c": "Discipline", "d": "Initiative"},
        answer="a"),
    SchemeQuestion(q_no="Q18", section="A", type="one_word", marks=1,
        question="Name the financial market that deals in long-term securities.",
        answer="Capital Market"),
    SchemeQuestion(q_no="Q19", section="A", type="mcq", marks=1,
        question="Which is a right of a consumer under Consumer Protection Act?",
        options={"a": "Right to exploit", "b": "Right to be heard", "c": "Right to overcharge", "d": "Right to hoard"},
        answer="b"),
    SchemeQuestion(q_no="Q20", section="A", type="mcq", marks=1,
        question="Selection is a ______ process while recruitment is a ______ process.",
        options={"a": "positive, negative", "b": "negative, positive", "c": "positive, positive", "d": "negative, negative"},
        answer="b"),
]

# --- Section B : 4 x 3 mark short answer -------------------------------------
SECTION_B = [
    SchemeQuestion(q_no="Q21", section="B", type="short", marks=3,
        question="Explain any three points of importance of planning.",
        key_points=["Provides direction", "Reduces risk of uncertainty", "Reduces overlapping and wasteful activities", "Promotes innovative ideas", "Facilitates decision making", "Establishes standards for controlling"]),
    SchemeQuestion(q_no="Q22", section="B", type="short", marks=3,
        question="State any three features of business environment.",
        key_points=["Totality of external forces", "Specific and general forces", "Inter-relatedness", "Dynamic nature", "Uncertainty", "Complexity", "Relativity"]),
    SchemeQuestion(q_no="Q23", section="B", type="short", marks=3,
        question="Distinguish between formal and informal organisation on any three bases.",
        key_points=["Formation: deliberate vs spontaneous", "Authority arises from position vs personal qualities", "Behaviour governed by rules vs group norms", "Flow of communication: scalar vs grapevine", "Leadership by managers vs anyone"]),
    SchemeQuestion(q_no="Q24", section="B", type="short", marks=3,
        question="Explain 'Selection' as a function of staffing and state any two of its steps.",
        key_points=["Selection is choosing the best candidate from applicants", "It is a negative process / rejection process", "Preliminary screening", "Selection tests", "Employment interview", "Reference and background checks", "Medical examination"]),
]

# --- Section C : 4 x 4 mark short answer -------------------------------------
SECTION_C = [
    SchemeQuestion(q_no="Q25", section="C", type="short", marks=4,
        question="Explain any four principles of scientific management given by Taylor.",
        key_points=["Science not rule of thumb", "Harmony not discord", "Cooperation not individualism", "Development of each person to greatest efficiency", "Mental revolution"]),
    SchemeQuestion(q_no="Q26", section="C", type="short", marks=4,
        question="Explain the importance of the directing function of management (any four points).",
        key_points=["Initiates action", "Integrates employees efforts", "Means of motivation", "Facilitates change", "Brings stability and balance in the organisation"]),
    SchemeQuestion(q_no="Q27", section="C", type="short", marks=4,
        question="Explain any four factors affecting the working capital requirement of a business.",
        key_points=["Nature of business", "Scale of operations", "Business cycle", "Seasonal factors", "Credit allowed and credit availed", "Operating efficiency", "Level of competition"]),
    SchemeQuestion(q_no="Q28", section="C", type="short", marks=4,
        question="Explain any four functions of SEBI.",
        key_points=["Regulatory functions", "Development functions", "Protective functions", "Registering brokers and intermediaries", "Prohibiting fraudulent and unfair trade practices", "Investor education", "Regulating stock exchanges"]),
]

# --- Section D : 4 x 5 mark long answer --------------------------------------
SECTION_D = [
    SchemeQuestion(q_no="Q29", section="D", type="long", marks=5,
        question="'Management is considered a profession.' Do you agree? Explain with reference to features of a profession.",
        key_points=["Well defined body of knowledge", "Restricted entry", "Professional association", "Ethical code of conduct", "Service motive", "Conclusion linking each feature to management"]),
    SchemeQuestion(q_no="Q30", section="D", type="long", marks=5,
        question="Explain the steps in the process of organising.",
        key_points=["Identification and division of work", "Departmentalisation", "Assignment of duties", "Establishing reporting relationships", "Coordination among levels"]),
    SchemeQuestion(q_no="Q31", section="D", type="long", marks=5,
        question="Explain any five financial decisions a finance manager has to take / factors affecting financing decision.",
        key_points=["Investment decision", "Financing decision", "Dividend decision", "Cost of debt vs equity", "Cash flow position", "Risk consideration", "Floatation cost", "Control consideration"]),
    SchemeQuestion(q_no="Q32", section="D", type="long", marks=5,
        question="'Controlling and planning are inter-related.' Explain the relationship. Also state steps of controlling.",
        key_points=["Planning is basis of controlling", "Controlling is the essence of planning", "Setting performance standards", "Measurement of actual performance", "Comparison with standards", "Analysing deviations", "Taking corrective action"]),
]

# --- Section E : 2 x 6 mark case-based ---------------------------------------
SECTION_E = [
    SchemeQuestion(q_no="Q33", section="E", type="case", marks=6,
        question="Case: A company increased sales by improving packaging and after-sale service. Identify and explain any three elements of marketing mix highlighted, and explain functions of packaging.",
        key_points=["Product element identified", "Promotion / after-sale service identified", "Packaging as part of product decision", "Product identification function", "Product protection function", "Facilitating use and promotion function", "Explanation of each identified element"]),
    SchemeQuestion(q_no="Q34", section="E", type="case", marks=6,
        question="Case: A consumer purchased a defective washing machine and the seller refused to replace it. Explain the consumer rights violated and the redressal agencies the consumer can approach.",
        key_points=["Right to safety", "Right to be informed", "Right to seek redressal", "Right to consumer education", "District Commission", "State Commission", "National Commission", "Appropriate forum based on value"]),
]

BUSINESS_STUDIES_80: List[SchemeQuestion] = (
    SECTION_A + SECTION_B + SECTION_C + SECTION_D + SECTION_E
)


def total_marks(scheme: List[SchemeQuestion] = None) -> int:
    scheme = scheme or BUSINESS_STUDIES_80
    return sum(q.marks for q in scheme)


def scheme_as_dicts(scheme: List[SchemeQuestion] = None) -> List[dict]:
    scheme = scheme or BUSINESS_STUDIES_80
    return [q.model_dump(exclude_none=True) for q in scheme]
