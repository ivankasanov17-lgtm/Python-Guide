import { Zap } from "lucide-react";
import { InterviewPage } from "@/components/InterviewPage";
import { fastapiInterviewQuestions } from "@/data/fastapi-interview";

export default function FastAPIInterviewPage() {
  return (
    <InterviewPage
      questions={fastapiInterviewQuestions}
      title="Вопросы по FastAPI"
      searchPlaceholder="Поиск вопросов FastAPI..."
      emptyIcon={<Zap className="w-full h-full" />}
    />
  );
}
