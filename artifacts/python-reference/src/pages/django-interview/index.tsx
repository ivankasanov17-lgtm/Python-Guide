import { Layers } from "lucide-react";
import { InterviewPage } from "@/components/InterviewPage";
import { djangoInterviewQuestions } from "@/data/django-interview";

export default function DjangoInterviewPage() {
  return (
    <InterviewPage
      questions={djangoInterviewQuestions}
      title="Вопросы по Django"
      searchPlaceholder="Поиск вопросов Django..."
      emptyIcon={<Layers className="w-full h-full" />}
    />
  );
}
