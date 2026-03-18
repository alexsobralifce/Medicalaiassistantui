import { useState, useEffect } from "react";
import { cidsApi, Cid } from "../../lib/api";
import { Input } from "./input";
import { Label } from "./label";
import { Search, CheckCircle2, Loader2, X } from "lucide-react";

interface CidSearchMenuProps {
  onSelectCid: (cid: Cid) => void;
  selectedCidStr?: string;
  label?: string;
}

export function CidSearchMenu({ onSelectCid, selectedCidStr, label = "Buscar CID-10" }: CidSearchMenuProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Cid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedCidStr) {
      setSearchTerm(selectedCidStr);
    }
  }, [selectedCidStr]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim() && isOpen) {
        setIsLoading(true);
        cidsApi.search(searchTerm)
          .then(setResults)
          .catch(err => console.error("Failed to search CIDs", err))
          .finally(() => setIsLoading(false));
      } else {
        setResults([]);
      }
    }, 300); // Debounce de 300ms
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  const handleSelect = (cid: Cid) => {
    const formattedStr = `${cid.code} - ${cid.description}`;
    setSearchTerm(formattedStr);
    setIsOpen(false);
    onSelectCid(cid);
  };

  const clearSelection = () => {
    setSearchTerm("");
    setResults([]);
    onSelectCid({ code: '', description: '' });
  };

  return (
    <div className="relative w-full">
      <Label className="mb-2 block">{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Ex: Dengue, J01, A90..."
          value={searchTerm}
          className="pl-9 pr-9 z-10 relative bg-background"
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (searchTerm.trim()) setIsOpen(true);
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        {searchTerm && (
          <button 
            type="button" 
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-20"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (searchTerm.trim().length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground flex justify-center items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Buscando no banco local...
            </div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((cid) => (
                <li 
                  key={cid.code}
                  className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center group transition-colors"
                  onMouseDown={() => handleSelect(cid)} // use onMouseDown to fire before onBlur
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-sm">{cid.code}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{cid.description}</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum CID encontrado para "{searchTerm}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
