# Esempio: Assistente Tecnico Specializzato con Prompt Engineering

Questo esempio dimostra come personalizzare il comportamento di un Large Language Model (LLM) locale per un uso specifico, trasformandolo in un "Assistente Tecnico Specializzato in Sviluppo Web Python", utilizzando tecniche avanzate di prompt engineering come il System Prompt e il Few-Shot Learning.

## Obiettivo

Creare un assistente virtuale che risponda a domande sullo sviluppo web in Python (es. Flask, Django) con risposte concise, pertinenti e orientate alla soluzione, simulando un esperto del settore.

## Prerequisiti

*   **Python 3.x** installato.
*   **Ollama** installato e in esecuzione (con un modello scaricato, es. `ollama pull llama3`).
*   Libreria Python: `ollama`.

## Passaggi Step-by-Step

### Passo 1: Installare la Libreria Ollama per Python

Se non l'hai già fatto, installa la libreria:

```bash
pip install ollama
```

### Passo 2: Scrivere lo Script Python per l'Assistente Specializzato

Crea un file Python chiamato `assistente_tecnico.py` e incolla il seguente codice. Presta particolare attenzione al `system_prompt` e agli esempi nel `user_prompt`.

```python
import ollama

def chat_with_technical_assistant(user_question, model_name='llama3'):
    """
    Interagisce con un LLM configurato come assistente tecnico specializzato.
    """

    # System Prompt: Definisce il ruolo e le regole dell'assistente
    system_prompt = """
Sei un assistente tecnico altamente specializzato nello sviluppo web con Python, in particolare con i framework Flask e Django. Il tuo obiettivo è fornire risposte concise, accurate e direttamente applicabili a problemi di programmazione. Concentrati su soluzioni pratiche e best practice. Se non conosci la risposta, ammettilo onestamente. Non divagare.

Formato della risposta:
Problema: [Breve descrizione del problema]
Soluzione: [Passaggi o codice per risolvere il problema]
Note: [Eventuali considerazioni aggiuntive o alternative]
"""

    # User Prompt con Few-Shot Examples: Guida il modello con esempi di input/output desiderati
    # Questo aiuta il modello a capire il formato e lo stile delle risposte attese.
    user_prompt = f"""
Problema: Come gestisco le sessioni utente in Flask?
Soluzione: Utilizza la libreria `flask.session`. Imposta `app.secret_key` per la sicurezza. I dati della sessione sono memorizzati nei cookie firmati.
Note: Per sessioni persistenti o più complesse, considera estensioni come Flask-Session o un database.

Problema: Qual è il modo migliore per configurare un database PostgreSQL con Django?
Soluzione: Definisci le impostazioni del database nel file `settings.py` del tuo progetto Django. Assicurati di avere `psycopg2` installato (`pip install psycopg2-binary`). Esegui `python manage.py migrate`.
Note: Utilizza variabili d'ambiente per le credenziali del database in produzione.

Problema: {user_question}
"""

    print(f"\nRichiesta inviata all'assistente tecnico ({model_name})...")
    try:
        response = ollama.chat(
            model=model_name,
            messages=[
                {
                    'role': 'system',
                    'content': system_prompt,
                },
                {
                    'role': 'user',
                    'content': user_prompt,
                },
            ],
            stream=False
        )
        assistant_response = response['message']['content']
        print("\n--- Risposta dell'Assistente Tecnico ---")
        print(assistant_response)
        print("--------------------------------------")
    except Exception as e:
        print(f"Errore durante l'interazione con Ollama: {e}")
        print("Assicurati che Ollama sia in esecuzione e che il modello specificato sia scaricato.")

if __name__ == "__main__":
    print("Benvenuto nell'Assistente Tecnico per lo Sviluppo Web Python!")
    print("Digita 'esci' per terminare.")

    while True:
        domanda = input("\nLa tua domanda: ")
        if domanda.lower() == 'esci':
            break
        chat_with_technical_assistant(domanda)
```

### Passo 3: Eseguire lo Script

Assicurati che il server Ollama sia in esecuzione (`ollama serve`) e che il modello `llama3` (o quello che hai scelto) sia scaricato (`ollama pull llama3`).

Quindi, esegui lo script Python dal tuo terminale:

```bash
python assistente_tecnico.py
```

## Risultato Atteso

Quando porrai una domanda relativa allo sviluppo web Python, l'LLM cercherà di rispondere adottando il ruolo di un esperto tecnico, fornendo soluzioni concise e seguendo il formato specificato nel prompt (Problema, Soluzione, Note). Questo dimostra come, senza alcun fine-tuning del modello, si possa guidare il suo comportamento e il formato delle risposte per un uso altamente specifico, semplicemente "istruendolo" tramite il prompt.

Questo approccio è estremamente flessibile e può essere adattato per creare assistenti per qualsiasi dominio, dalla consulenza legale alla scrittura creativa, semplicemente modificando il `system_prompt` e fornendo esempi pertinenti.