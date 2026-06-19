import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import NotFound from "@/pages/not-found";

// Pages
import ReferencePage from "@/pages/reference";
import ExamplesPage from "@/pages/examples";
import DjangoPage from "@/pages/django";
import FastAPIPage from "@/pages/fastapi";
import DjangoExamplesPage from "@/pages/django-examples";
import FastAPIExamplesPage from "@/pages/fastapi-examples";
import PythonInterviewPage from "@/pages/python-interview";
import DjangoInterviewPage from "@/pages/django-interview";
import FastAPIInterviewPage from "@/pages/fastapi-interview";
import DrfPage from "@/pages/drf";
import DrfExamplesPage from "@/pages/drf-examples";
import DrfInterviewPage from "@/pages/drf-interview";
import ReviewPage from "@/pages/review";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/">
            <Redirect to="/reference" />
          </Route>
          <Route path="/reference" component={ReferencePage} />
          <Route path="/examples" component={ExamplesPage} />
          <Route path="/django" component={DjangoPage} />
          <Route path="/fastapi" component={FastAPIPage} />
          <Route path="/django-examples" component={DjangoExamplesPage} />
          <Route path="/fastapi-examples" component={FastAPIExamplesPage} />
          <Route path="/python-interview" component={PythonInterviewPage} />
          <Route path="/django-interview" component={DjangoInterviewPage} />
          <Route path="/fastapi-interview" component={FastAPIInterviewPage} />
          <Route path="/drf" component={DrfPage} />
          <Route path="/drf-examples" component={DrfExamplesPage} />
          <Route path="/drf-interview" component={DrfInterviewPage} />
          <Route path="/review" component={ReviewPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
