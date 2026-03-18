import { useState, useEffect } from "react";
import { Search, Stethoscope, Loader2, BookOpen } from "lucide-react";
import { Input } from "../ui/input";
import { cidsApi, Cid } from "../../lib/api";
import { Button } from "../ui/button";

export function CidDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Cid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        setIsLoading(true);
        setHasSearched(true);
        cidsApi.search(searchTerm)
          .then(setResults)
          .catch(err => console.error("Failed to search CIDs", err))
          .finally(() => setIsLoading(false));
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 400); 

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="p-6 lg:p-10 h-full flex flex-col bg-background relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Catálogo CID-10</h1>
          </div>
          <p className="text-muted-foreground mt-1">Consulte milhares de códigos internacionais de doenças offline e rapidamente.</p>
        </div>
      </header>

      <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/20">
          <div className="relative max-w-2xl mx-auto">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
             <Input 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Digite o código (ex: A90) ou a descrição (ex: Dengue)..." 
               className="pl-12 py-6 text-lg rounded-xl bg-background border-primary/20 focus-visible:ring-primary shadow-sm"
               autoFocus
             />
             {isLoading && (
               <div className="absolute right-4 top-1/2 -translate-y-1/2">
                 <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
               </div>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-background">
          {!hasSearched ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 max-w-sm mx-auto text-center space-y-4">
               <Stethoscope className="w-16 h-16" />
               <p className="text-lg">Digite algo na barra de pesquisa acima para encontrar rapidamente o código CID-10 desejado.</p>
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 text-center space-y-3">
               <BookOpen className="w-12 h-12 mb-2" />
               <p className="text-lg font-medium text-foreground">Nenhum resultado encontrado.</p>
               <p>Não encontramos a doença ou código informados no banco local.</p>
               <Button variant="outline" className="mt-4" onClick={() => setSearchTerm('')}>Limpar busca</Button>
            </div>
          ) : (
            <div className="grid gap-3 max-w-4xl mx-auto">
               <div className="text-sm font-medium text-muted-foreground mb-2 px-1">
                 Mostrando até 20 resultados relevantes:
               </div>
               {results.map(cid => (
                 <div key={cid.code} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:border-primary/40 transition-colors">
                   <div className="flex-shrink-0">
                     <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-mono font-bold text-lg tracking-wider border border-orange-200 dark:border-orange-800">
                       {cid.code}
                     </span>
                   </div>
                   <div className="flex-1">
                     <p className="text-foreground font-medium text-lg leading-snug">{cid.description}</p>
                   </div>
                   <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => {
                        navigator.clipboard.writeText(`${cid.code} - ${cid.description}`);
                      }}>
                         Copiar
                      </Button>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
