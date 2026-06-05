import { Code2 } from "lucide-react";
import { InterviewPage } from "@/components/InterviewPage";
import { pythonInterviewQuestions } from "@/data/python-interview";

export default function PythonInterviewPage() {
  return (
    <InterviewPage
      questions={pythonInterviewQuestions}
      title="Вопросы по Python"
      searchPlaceholder="Поиск вопросов Python..."
      emptyIcon={<Code2 className="w-full h-full" />}
    />
  );
}
