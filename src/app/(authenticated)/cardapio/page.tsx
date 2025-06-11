
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Utensils } from "lucide-react";

interface MenuItem {
  principal: string;
  opcaoVegetariana: string;
  saladas: string[];
  guarnicao: string;
  sobremesa: string;
  suco: string;
}

interface DailyMenu {
  date: string;
  dayOfWeek: string;
  almoco?: MenuItem;
  jantar?: MenuItem;
}

// Helper function to strip HTML tags and clean text
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// Helper function to parse a <td> element, extracting text and rowspan
function parseTd(tdHtml: string): { text: string; rowspan: number } {
  const text = stripHtml(tdHtml);
  const rowspanMatch = tdHtml.match(/rowspan=["']?(\d+)["']?/i);
  const rowspan = rowspanMatch ? parseInt(rowspanMatch[1], 10) : 1;
  return { text, rowspan };
}

async function getCardapioData(): Promise<DailyMenu[] | null> {
  const targetUrl = 'https://guri.unipampa.edu.br/run/publico/listar';
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      next: { revalidate: 3600 } // Revalidate every hour
    });
    if (!response.ok) {
      let responseBody = "";
      try {
        responseBody = await response.text();
      } catch (e) {
        responseBody = "Não foi possível ler o corpo da resposta.";
      }
      console.error(
        `[CardapioPage - getCardapioData] Erro ao buscar cardápio: Status ${response.status}`,
        `URL: ${targetUrl}`,
        `Response Body Preview: ${responseBody.substring(0, 500)}`
      );
      return null;
    }
    const html = await response.text();

    const uruguaianaMenu: DailyMenu[] = [];
    
    const uruguaianaHeaderString = "<h2>Uruguaiana</h2>";
    const uruguaianaIndex = html.indexOf(uruguaianaHeaderString);

    if (uruguaianaIndex === -1) {
      console.error("[CardapioPage - getCardapioData] Seção 'Uruguaiana' não encontrada no HTML.", `URL: ${targetUrl}`);
      return null;
    }

    const tableStartIndex = html.indexOf("<table", uruguaianaIndex);
    if (tableStartIndex === -1) {
      console.error("[CardapioPage - getCardapioData] Tabela de Uruguaiana não encontrada no HTML.", `URL: ${targetUrl}`);
      return null;
    }

    const tableEndIndex = html.indexOf("</table>", tableStartIndex);
    if (tableEndIndex === -1) {
      console.error("[CardapioPage - getCardapioData] Fim da tabela de Uruguaiana não encontrado no HTML.", `URL: ${targetUrl}`);
      return null;
    }

    const tableHtml = html.substring(tableStartIndex, tableEndIndex + "</table>".length);
    
    const tbodyStartIndex = tableHtml.indexOf("<tbody>");
    const tbodyEndIndex = tableHtml.indexOf("</tbody>", tbodyStartIndex);

    if (tbodyStartIndex === -1 || tbodyEndIndex === -1) {
        console.error("[CardapioPage - getCardapioData] Corpo da tabela (tbody) de Uruguaiana não encontrado.", `URL: ${targetUrl}`);
        return null;
    }

    const tbodyHtml = tableHtml.substring(tbodyStartIndex + "<tbody>".length, tbodyEndIndex);
    const rowsHtml = tbodyHtml.split("</tr>").filter(row => row.trim() !== "");

    let currentDate = "";
    let currentDayOfWeek = "";
    let rowspanCount = 0;
    let currentDailyMenu: DailyMenu | undefined = undefined;

    for (const rowHtml of rowsHtml) {
      const cellsHtmlMatch = rowHtml.matchAll(/<td[^>]*>(.*?)<\/td>/gi);
      const cellsHtml = Array.from(cellsHtmlMatch, m => m[0]);

      if (cellsHtml.length < 7) continue; // Skip malformed rows

      let cellIndex = 0;
      let mealType = "";
      let menuItem: MenuItem;

      if (rowspanCount <= 0 || cellsHtml.length === 8) { // New date row or rowspan expired
        const dateTd = parseTd(cellsHtml[cellIndex++]);
        currentDate = dateTd.text.replace(/\s*\(.*?\)\s*/, '').trim(); // Remove (Day of week) from date
        const dayOfWeekMatch = dateTd.text.match(/\((.*?)\)/);
        currentDayOfWeek = dayOfWeekMatch ? dayOfWeekMatch[1] : "";
        rowspanCount = dateTd.rowspan;
        
        currentDailyMenu = uruguaianaMenu.find(m => m.date === currentDate);
        if (!currentDailyMenu) {
            currentDailyMenu = { date: currentDate, dayOfWeek: currentDayOfWeek, almoco: undefined, jantar: undefined };
            uruguaianaMenu.push(currentDailyMenu);
        }
      }
      
      if (!currentDailyMenu) continue; // Should not happen if logic is correct

      rowspanCount--;

      mealType = stripHtml(cellsHtml[cellIndex++]);
      
      menuItem = {
        principal: stripHtml(cellsHtml[cellIndex++]),
        opcaoVegetariana: stripHtml(cellsHtml[cellIndex++]),
        saladas: stripHtml(cellsHtml[cellIndex++]).split('/').map(s => s.trim()).filter(s => s),
        guarnicao: stripHtml(cellsHtml[cellIndex++]),
        sobremesa: stripHtml(cellsHtml[cellIndex++]),
        suco: stripHtml(cellsHtml[cellIndex++]),
      };

      if (mealType.toLowerCase() === "almoço") {
        currentDailyMenu.almoco = menuItem;
      } else if (mealType.toLowerCase() === "jantar") {
        currentDailyMenu.jantar = menuItem;
      }
    }
    
    return uruguaianaMenu.filter(menu => menu.almoco || menu.jantar); // Filter out days with no meals parsed

  } catch (error: any) {
    console.error(
      `[CardapioPage - getCardapioData] Falha ao buscar ou processar o cardápio. URL: ${targetUrl}`,
      `ErrorType: ${error?.constructor?.name}`,
      `Message: ${error?.message}`,
      `Cause: ${error?.cause ?? 'N/A'}`,
      // Descomente a linha abaixo para logar o objeto de erro completo em desenvolvimento, se necessário
      // error 
    );
    return null;
  }
}

function MenuItemDisplay({ item, type }: { item: MenuItem, type: string }) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold text-primary">Prato Principal:</h4>
        <p className="text-sm text-foreground/90">{item.principal || "Não informado"}</p>
      </div>
      <div>
        <h4 className="font-semibold text-primary">Opção Vegetariana:</h4>
        <p className="text-sm text-foreground/90">{item.opcaoVegetariana || "Não informado"}</p>
      </div>
      <div>
        <h4 className="font-semibold text-primary">Guarnição:</h4>
        <p className="text-sm text-foreground/90">{item.guarnicao || "Não informado"}</p>
      </div>
      {item.saladas && item.saladas.length > 0 && (
        <div>
          <h4 className="font-semibold text-primary">Saladas:</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {item.saladas.map((salada, idx) => (
              <Badge key={`${type}-salada-${idx}`} variant="secondary" className="text-xs">{salada}</Badge>
            ))}
          </div>
        </div>
      )}
      <div>
        <h4 className="font-semibold text-primary">Sobremesa:</h4>
        <p className="text-sm text-foreground/90">{item.sobremesa || "Não informado"}</p>
      </div>
      <div>
        <h4 className="font-semibold text-primary">Suco:</h4>
        <p className="text-sm text-foreground/90">{item.suco || "Não informado"}</p>
      </div>
    </div>
  );
}

export default async function CardapioPage() {
  const cardapio = await getCardapioData();

  if (!cardapio || cardapio.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="shadow-lg">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Erro ao Carregar Cardápio</AlertTitle>
          <AlertDescription>
            Não foi possível carregar o cardápio de Uruguaiana do site da Unipampa. 
            Isso pode ocorrer se o site estiver fora do ar, se sua estrutura mudou, ou por problemas de conectividade do servidor. 
            Por favor, tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <Utensils className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold font-headline text-primary">Cardápio RU - Uruguaiana</h1>
        <p className="text-muted-foreground">Confira o cardápio da semana para o Restaurante Universitário.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardapio.map((dia, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-headline text-primary/90">{dia.date}</CardTitle>
              <CardDescription className="text-muted-foreground">{dia.dayOfWeek}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                {dia.almoco && (
                  <AccordionItem value={`almoco-${index}`} className="border-b-0">
                    <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:bg-accent/50 data-[state=open]:bg-accent/10">
                      Almoço
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2 bg-background">
                      <MenuItemDisplay item={dia.almoco} type="almoco" />
                    </AccordionContent>
                  </AccordionItem>
                )}
                {dia.jantar && (
                  <AccordionItem value={`jantar-${index}`} className="border-b-0">
                     <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:bg-accent/50 data-[state=open]:bg-accent/10">
                      Jantar
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2 bg-background">
                      <MenuItemDisplay item={dia.jantar} type="jantar" />
                    </AccordionContent>
                  </AccordionItem>
                )}
                {!dia.almoco && !dia.jantar && (
                    <div className="p-6 text-muted-foreground">
                        Nenhuma refeição informada para este dia.
                    </div>
                )}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-8">
        Informações extraídas de <a href="https://guri.unipampa.edu.br/run/publico/listar" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">guri.unipampa.edu.br/run/publico/listar</a>.
        A exatidão e disponibilidade dependem da fonte original.
      </p>
    </div>
  );
}

