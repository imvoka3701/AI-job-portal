"""Versioned, deterministic scoring for public MBTI and MI self-assessments."""

from dataclasses import dataclass
from typing import Literal

from fastapi import HTTPException, status

from app.schemas.assessment import AssessmentResult, AssessmentType


@dataclass(frozen=True)
class Question:
    id: str
    text: str
    group: str
    positive: bool = True


MBTI_VERSION = "mbti-v1"
MI_VERSION = "mi-v1"


def _questions(prefix: str, groups: list[tuple[str, list[str]]]) -> tuple[Question, ...]:
    items: list[Question] = []
    index = 1
    for group, texts in groups:
        for text in texts:
            items.append(Question(f"{prefix}-{index:02d}", text, group))
            index += 1
    return tuple(items)


MBTI_QUESTIONS = _questions("mbti", [
    ("EI", [
        "Tôi chủ động bắt chuyện với người mới.", "Tôi thấy có thêm năng lượng sau một buổi gặp gỡ.",
        "Tôi thích trình bày ý tưởng bằng lời nói.", "Tôi thường tham gia tích cực trong nhóm.",
        "Tôi dễ chia sẻ suy nghĩ với đồng nghiệp.", "Tôi thích làm quen với nhiều người.",
        "Tôi thường suy nghĩ thành tiếng khi giải quyết vấn đề.", "Tôi cảm thấy thoải mái ở sự kiện đông người.",
        "Tôi tìm cơ hội thảo luận khi gặp vấn đề.", "Tôi thích môi trường làm việc nhiều tương tác.",
    ]),
    ("SN", [
        "Tôi chú ý đến dữ kiện và chi tiết cụ thể.", "Tôi thích làm việc với quy trình đã rõ ràng.",
        "Tôi kiểm tra thông tin trước khi kết luận.", "Tôi ưu tiên giải pháp đã được kiểm chứng.",
        "Tôi ghi nhớ tốt các ví dụ thực tế.", "Tôi thích hướng dẫn có từng bước cụ thể.",
        "Tôi thường dựa vào kinh nghiệm khi ra quyết định.", "Tôi quan tâm cách một hệ thống vận hành thực tế.",
        "Tôi thích mục tiêu đo được hơn ý tưởng chung chung.", "Tôi nhận ra các sai khác nhỏ trong tài liệu.",
    ]),
    ("TF", [
        "Tôi cân nhắc tiêu chí logic khi ra quyết định.", "Tôi góp ý trực tiếp để cải thiện kết quả.",
        "Tôi ưu tiên tính nhất quán trong chính sách.", "Tôi phân tích nguyên nhân trước khi phản ứng.",
        "Tôi thấy tranh luận dựa trên dữ liệu là hữu ích.", "Tôi tách vấn đề khỏi cảm xúc cá nhân.",
        "Tôi đánh giá phương án theo hiệu quả và tác động.", "Tôi thường hỏi bằng chứng khi nghe một kết luận.",
        "Tôi thích giải quyết bất đồng bằng lập luận.", "Tôi xem phản biện là một phần của cải tiến.",
    ]),
    ("JP", [
        "Tôi thường lập kế hoạch trước khi bắt đầu.", "Tôi thích hoàn thành việc trước hạn.",
        "Tôi sắp xếp công việc theo mức ưu tiên.", "Tôi thấy yên tâm khi lịch làm việc rõ ràng.",
        "Tôi thường quyết định sớm để triển khai.", "Tôi thích danh sách việc cần làm cụ thể.",
        "Tôi chủ động theo dõi tiến độ của mình.", "Tôi ít thay đổi kế hoạch nếu không có lý do rõ ràng.",
        "Tôi thích môi trường có quy tắc vận hành ổn định.", "Tôi thường chốt một phương án thay vì để mở.",
    ]),
])


MI_GROUPS: tuple[tuple[str, str, list[str]], ...] = (
    ("linguistic", "Ngôn ngữ", ["Tôi diễn đạt ý tưởng bằng chữ viết rõ ràng.", "Tôi thích đọc và phân tích văn bản.", "Tôi dễ nhớ thông tin qua câu chuyện.", "Tôi thích học từ mới và cách dùng từ.", "Tôi thường giúp người khác diễn đạt tốt hơn."]),
    ("logical", "Logic", ["Tôi thích tìm quy luật trong dữ liệu.", "Tôi thường chia vấn đề thành các bước nhỏ.", "Tôi hứng thú với con số và lập luận.", "Tôi kiểm tra giả định trước khi kết luận.", "Tôi thích giải câu đố hoặc bài toán."]),
    ("spatial", "Không gian", ["Tôi hình dung tốt bố cục và hình ảnh.", "Tôi thích sơ đồ, bản đồ hoặc bản phác thảo.", "Tôi nhận ra nhanh sự cân đối trong thiết kế.", "Tôi dễ định hướng trong không gian mới.", "Tôi thích học qua hình ảnh trực quan."]),
    ("bodily", "Vận động", ["Tôi học tốt khi được thực hành.", "Tôi phối hợp tay mắt khá chính xác.", "Tôi thích hoạt động cần thao tác trực tiếp.", "Tôi thường dùng cử chỉ để minh họa.", "Tôi duy trì được nhịp độ trong hoạt động thể chất."]),
    ("musical", "Âm nhạc", ["Tôi nhận ra khác biệt về cao độ và nhịp điệu.", "Âm nhạc giúp tôi tập trung hoặc ghi nhớ.", "Tôi thích tìm hiểu cấu trúc của một bài nhạc.", "Tôi dễ bắt nhịp khi nghe giai điệu.", "Tôi thường dùng âm thanh để tạo cảm hứng."]),
    ("interpersonal", "Giao tiếp", ["Tôi nhận biết khá tốt cảm xúc của người khác.", "Tôi thích hỗ trợ mọi người phối hợp với nhau.", "Tôi thường lắng nghe trước khi đưa lời khuyên.", "Tôi dễ xây dựng quan hệ làm việc tin cậy.", "Tôi thích giải quyết bất đồng bằng đối thoại."]),
    ("intrapersonal", "Tự nhận thức", ["Tôi hiểu rõ điều gì tạo động lực cho mình.", "Tôi thường tự đánh giá lại sau một trải nghiệm.", "Tôi biết cách điều chỉnh mục tiêu cá nhân.", "Tôi dành thời gian suy ngẫm về lựa chọn của mình.", "Tôi nhận diện được điểm mạnh và điểm cần cải thiện."]),
    ("naturalistic", "Tự nhiên", ["Tôi chú ý đến các mẫu hình trong môi trường xung quanh.", "Tôi thích tìm hiểu thiên nhiên và hệ sinh thái.", "Tôi phân loại sự vật theo đặc điểm chung.", "Tôi cảm thấy thoải mái khi làm việc ngoài trời.", "Tôi quan tâm đến tác động của công việc lên môi trường."]),
)

MI_QUESTIONS = tuple(
    Question(f"mi-{index:02d}", text, group)
    for group, _label, texts in MI_GROUPS
    for index, text in enumerate(texts, start=1 + MI_GROUPS.index((group, _label, texts)) * 5)
)


def get_questions(assessment_type: AssessmentType) -> tuple[Question, ...]:
    return MBTI_QUESTIONS if assessment_type == "mbti" else MI_QUESTIONS


def get_version(assessment_type: AssessmentType) -> str:
    return MBTI_VERSION if assessment_type == "mbti" else MI_VERSION


def _validate_answers(assessment_type: AssessmentType, version: str, answers: dict[str, int]) -> tuple[Question, ...]:
    expected_version = get_version(assessment_type)
    questions = get_questions(assessment_type)
    expected_ids = {item.id for item in questions}
    if version != expected_version or set(answers) != expected_ids or any(value < 1 or value > 5 for value in answers.values()):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Bộ câu trả lời không hợp lệ hoặc đã hết phiên bản.")
    return questions


def score_assessment(assessment_type: AssessmentType, version: str, answers: dict[str, int]) -> AssessmentResult:
    questions = _validate_answers(assessment_type, version, answers)
    if assessment_type == "mbti":
        dimensions: dict[str, float] = {}
        for axis in ("EI", "SN", "TF", "JP"):
            values = [answers[item.id] for item in questions if item.group == axis]
            dimensions[axis] = round(sum(values) / len(values) * 20, 1)
        code = "".join((axis[0] if dimensions[axis] >= 50 else axis[1]) for axis in ("EI", "SN", "TF", "JP"))
        profiles = {
            "E": "Chủ động kết nối và tạo năng lượng qua tương tác.", "I": "Tập trung sâu và phát triển ý tưởng qua suy ngẫm.",
            "S": "Thực tế, chú ý dữ kiện và cách triển khai cụ thể.", "N": "Nhìn thấy khả năng mới và kết nối các ý tưởng.",
            "T": "Ưu tiên logic, tiêu chí và tính nhất quán.", "F": "Cân nhắc con người, giá trị và tác động của quyết định.",
            "J": "Có cấu trúc, chủ động lập kế hoạch và chốt việc.", "P": "Linh hoạt, thích khám phá và điều chỉnh theo tình huống.",
        }
        return AssessmentResult(code=code, title=f"Nhóm tính cách {code}", summary=" ".join(profiles[letter] for letter in code), strengths=[profiles[letter] for letter in code], environments=["Môi trường tôn trọng cách làm việc khác nhau", "Mục tiêu và phản hồi rõ ràng"], career_ctas=["Xem việc làm phù hợp", "Tối ưu CV theo vị trí"], dimensions=dimensions)

    scores = {group: round(sum(answers[item.id] for item in questions if item.group == group) / 5 * 20, 1) for group, _label, _texts in MI_GROUPS}
    top = sorted(scores, key=scores.get, reverse=True)[:3]
    labels = {group: label for group, label, _texts in MI_GROUPS}
    return AssessmentResult(code="+".join(top), title="Hồ sơ năng lực đa dạng", summary="Bạn nổi trội ở " + ", ".join(labels[group] for group in top) + ".", strengths=[labels[group] for group in top], environments=["Công việc cho phép phát huy thế mạnh", "Môi trường khuyến khích học hỏi liên tục"], career_ctas=["Khám phá nghề phù hợp", "Xây dựng CV nổi bật"], dimensions=scores)
