import asyncio
from app.database import SessionLocal
from app.schemas.assistant import ChatMessage, ChatContext
from app.services.assistant_service import assistant_service

async def main():
    db = SessionLocal()
    try:
        messages = [
            ChatMessage(
                role="assistant",
                content="Xin chào! Tôi là **JobPortal AI Copilot** 🤖. Tôi có thể hỗ trợ bạn tìm việc làm phù hợp, hướng dẫn tạo CV chuẩn ATS, luyện phỏng vấn, hoặc soạn bản mô tả công việc (JD). Bạn cần tôi giúp gì hôm nay?"
            ),
            ChatMessage(
                role="user",
                content="hãy tư vấn cho tôi những công việc hot trend năm 2026"
            )
        ]
        context = ChatContext(current_path="/", role="guest")
        resp = await assistant_service.process_chat(
            messages=messages,
            context=context,
            current_user=None,
            db=db
        )
        print("REPLY:")
        print(resp.reply)
        print("CARDS COUNT:", len(resp.suggested_cards))
        for c in resp.suggested_cards:
            print("  -", c.card_type, "|", c.title)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
