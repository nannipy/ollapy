# Esempio: Riassunto Documenti Privati con LLM Locale

Questo esempio illustra come implementare un semplice sistema di riassunto di documenti che garantisce la privacy, utilizzando un Large Language Model (LLM) eseguito interamente in locale. Non verranno inviati dati a servizi cloud esterni.

## Obiettivo

Creare uno script Python che prenda in input un file di testo locale e generi un riassunto, utilizzando un LLM come Ollama.

## Prerequisiti

*   **Python 3.x** installato.
*   **Ollama** installato e in esecuzione (con un modello scaricato, es. `ollama pull llama3`).
*   Librerie Python: `ollama` (per interagire con l'API di Ollama).

## Passaggi Step-by-Step

### Passo 1: Installare la Libreria Ollama per Python

Apri il tuo terminale e installa la libreria Python per Ollama:

```bash
pip install ollama
```

### Passo 2: Creare il File del Documento di Esempio

Crea un file di testo chiamato `documento_privato.txt` nella stessa directory dove salverai lo script Python. Inserisci al suo interno un testo lungo che desideri riassumere. Ad esempio:

```text
# documento_privato.txt

La rivoluzione industriale è stata un periodo di grandi cambiamenti socio-economici e tecnologici che ha avuto inizio in Gran Bretagna nel XVIII secolo e si è poi diffusa in gran parte del mondo. Questo periodo è caratterizzato dall'introduzione di nuove macchine, in particolare la macchina a vapore, che ha trasformato i processi produttivi, passando da un'economia agricola e artigianale a una industriale e meccanizzata.

Le principali innovazioni includono lo sviluppo di nuove fonti di energia (carbone e vapore), l'invenzione di macchinari tessili come il telaio meccanico e la spinning jenny, e l'introduzione di nuovi metodi di produzione del ferro. Questi cambiamenti hanno portato alla nascita delle fabbriche, all'urbanizzazione e alla formazione di nuove classi sociali, come la borghesia industriale e il proletariato operaio.

L'impatto della rivoluzione industriale è stato profondo e duraturo, influenzando non solo l'economia e la tecnologia, ma anche la società, la cultura e l'ambiente. Ha posto le basi per il mondo moderno, con la crescita della produzione di massa, l'espansione del commercio globale e l'accelerazione del progresso tecnologico. Tuttavia, ha anche sollevato questioni sociali significative, come le condizioni di lavoro nelle fabbriche, lo sfruttamento minorile e l'inquinamento.
```

### Passo 3: Scrivere lo Script Python per il Riassunto

Crea un file Python chiamato `riassumi_documento.py` e incolla il seguente codice:

```python
import ollama
import os

def riassumi_documento(file_path, model_name='llama3'):
    """
    Legge un documento locale e ne genera un riassunto usando un LLM locale (Ollama).
    """
    if not os.path.exists(file_path):
        print(f"Errore: Il file '{file_path}' non esiste.")
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            document_content = f.read()
    except Exception as e:
        print(f"Errore durante la lettura del file: {e}")
        return

    print(f"Contenuto del documento letto (primi 200 caratteri):\n{document_content[:200]}...")

    prompt = f"""Riassumi il seguente documento in modo conciso e chiaro, evidenziando i punti chiave. Il riassunto deve essere lungo circa 3-5 frasi.

Documento:
{document_content}

Riassunto:"""

    print(f"\nRichiesta di riassunto inviata al modello {model_name}...")
    try:
        response = ollama.chat(
            model=model_name,
            messages=[
                {
                    'role': 'user',
                    'content': prompt,
                },
            ],
            stream=False # Non usare lo streaming per un riassunto completo
        )
        summary = response['message']['content']
        print("\n--- Riassunto Generato ---")
        print(summary)
        print("------------------------")
    except Exception as e:
        print(f"Errore durante la generazione del riassunto con Ollama: {e}")
        print("Assicurati che Ollama sia in esecuzione e che il modello specificato sia scaricato.")

if __name__ == "__main__":
    document_to_summarize = 'documento_privato.txt'
    riassumi_documento(document_to_summarize)
```

### Passo 4: Eseguire lo Script

Assicurati che il server Ollama sia in esecuzione (di solito `ollama serve` in un terminale separato) e che il modello `llama3` (o quello che hai scelto) sia scaricato (`ollama pull llama3`).

Quindi, esegui lo script Python dal tuo terminale:

```bash
python riassumi_documento.py
```

## Risultato Atteso

Lo script leggerà il contenuto di `documento_privato.txt`, lo invierà al tuo LLM locale (Ollama) e stamperà il riassunto generato direttamente nel terminale. Tutti i dati rimangono sul tuo sistema, garantendo la massima privacy.

Questo esempio può essere esteso per gestire diversi formati di file, interfacce utente più complesse o integrazioni con altri sistemi locali, mantenendo sempre il controllo sui tuoi dati.