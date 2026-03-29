import { motion } from "framer-motion";
import { Wrench, ArrowRight, Code } from "lucide-react";
import { Link } from "wouter";

export default function ExamplesPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative bg-card border-2 border-border shadow-xl rounded-3xl w-full h-full flex items-center justify-center rotate-6 hover:rotate-0 transition-transform duration-500">
            <Wrench className="w-12 h-12 text-primary -rotate-6" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
          В разработке
        </h1>
        
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          Раздел со сложными практическими примерами и паттернами проектирования скоро появится. Мы готовим лучшие кейсы!
        </p>

        <div className="p-6 bg-muted/50 rounded-2xl border border-border mb-10">
          <div className="flex items-start gap-4 text-left">
            <div className="bg-background p-2 rounded-lg shadow-sm">
              <Code className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Что здесь будет?</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Применение декораторов на практике</li>
                <li>• Асинхронное программирование (asyncio)</li>
                <li>• Метаклассы и магия Python</li>
                <li>• Работа с генераторами и итераторами</li>
              </ul>
            </div>
          </div>
        </div>

        <Link 
          href="/reference" 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          Вернуться к справочнику
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
