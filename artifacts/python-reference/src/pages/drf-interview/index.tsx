import { Zap } from "lucide-react";
import { InterviewPage } from "@/components/InterviewPage";
import { drfInterviewQuestions } from "@/data/drf-interview";

export default function DrfInterviewPage() {
  return (
    <InterviewPage
      questions={drfInterviewQuestions}
      title="Вопросы по Django REST Framework"
      searchPlaceholder="Поиск вопросов DRF..."
      emptyIcon={<Zap className="w-full h-full" />}
    />
  );
}
