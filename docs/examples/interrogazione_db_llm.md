# Esempio: Interrogazione di un Database Locale con Linguaggio Naturale (RAG)

Questo esempio dimostra come collegare un Large Language Model (LLM) locale a un database SQLite per consentire agli utenti di interrogare i dati utilizzando il linguaggio naturale. Utilizzeremo una forma semplificata di Retrieval Augmented Generation (RAG) per fornire all'LLM il contesto necessario.

## Obiettivo

Permettere agli utenti di fare domande in linguaggio naturale su un database di prodotti e ottenere risposte accurate, senza esporre il database direttamente all'LLM o inviare dati all'esterno.

## Prerequisiti

*   **Python 3.x** installato.
*   **Ollama** installato e in esecuzione (con un modello scaricato, es. `ollama pull llama3`).
*   Librerie Python: `ollama`, `sqlite3` (built-in).

## Passaggi Step-by-Step

### Passo 1: Creare un Database SQLite di Esempio

Crea un file Python chiamato `setup_db.py` per creare un semplice database di prodotti:

```python
import sqlite3

def setup_database():
    conn = sqlite3.connect('prodotti.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prodotti (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            categoria TEXT NOT NULL,
            prezzo REAL NOT NULL,
            disponibilita INTEGER NOT NULL
        )
    ''')

    # Inserisci alcuni dati di esempio
    prodotti_data = [
        ('Laptop Gaming', 'Elettronica', 1200.00, 10),
        ('Mouse Wireless', 'Elettronica', 25.50, 50),
        ('Tastiera Meccanica', 'Elettronica', 80.00, 30),
        ('Libro di Fantascienza', 'Libri', 15.99, 100),
        ('Cuffie Bluetooth', 'Elettronica', 75.00, 40),
        ('Set di Pennelli', 'Arte', 12.00, 70),
        ('Monitor 27 pollici', 'Elettronica', 300.00, 15)
    ]

    cursor.executemany('''
        INSERT OR IGNORE INTO prodotti (nome, categoria, prezzo, disponibilita) VALUES (?, ?, ?, ?)
    ''', prodotti_data)

    conn.commit()
    conn.close()
    print("Database 'prodotti.db' creato e popolato con successo.")

if __name__ == "__main__":
    setup_database()
```

Esegui questo script una volta per creare il database:

```bash
python setup_db.py
```

### Passo 2: Scrivere lo Script di Interrogazione con LLM

Crea un file Python chiamato `interroga_db.py` e incolla il seguente codice. Questo script userà l'LLM per generare una query SQL basandosi sulla domanda dell'utente, la eseguirà sul database e poi userà l'LLM per formattare la risposta.

```python
import ollama
import sqlite3

def get_db_schema():
    """
    Restituisce lo schema della tabella prodotti per fornire contesto all'LLM.
    """
    return """
    Tabella: prodotti
    Colonne: id (INTEGER), nome (TEXT), categoria (TEXT), prezzo (REAL), disponibilita (INTEGER)
    """

def execute_sql_query(query):
    """
    Esegue una query SQL sul database prodotti.db e restituisce i risultati.
    """
    conn = sqlite3.connect('prodotti.db')
    cursor = conn.cursor()
    try:
        cursor.execute(query)
        results = cursor.fetchall()
        conn.close()
        return results
    except sqlite3.Error as e:
        conn.close()
        return f"Errore SQL: {e}"

def natural_language_query(user_question, model_name='llama3'):
    schema = get_db_schema()

    # Passo 1: LLM genera la query SQL
    sql_prompt = f"""Dato il seguente schema di database:
{schema}

Converti la seguente domanda in linguaggio naturale in una query SQL valida per SQLite. Restituisci SOLO la query SQL, senza spiegazioni o testo aggiuntivo.
Domanda: {user_question}
Query SQL:"""

    print(f"\nGenerazione query SQL per: '{user_question}'...")
    try:
        sql_response = ollama.chat(
            model=model_name,
            messages=[
                {
                    'role': 'user',
                    'content': sql_prompt,
                },
            ],
            stream=False
        )
        sql_query = sql_response['message']['content'].strip()
        # Pulizia della query: a volte l'LLM aggiunge ```sql o simili
        if sql_query.startswith('```sql'):
            sql_query = sql_query[len('```sql'):].strip()
        if sql_query.endswith('```'):
            sql_query = sql_query[:-len('```')].strip()

        print(f"Query SQL generata: {sql_query}")
    except Exception as e:
        print(f"Errore nella generazione della query SQL: {e}")
        return "Non sono riuscito a generare la query SQL."

    # Passo 2: Esegui la query SQL
    db_results = execute_sql_query(sql_query)
    print(f"Risultati dal database: {db_results}")

    if isinstance(db_results, str) and "Errore SQL" in db_results:
        return f"Si è verificato un errore durante l'esecuzione della query: {db_results}"
    elif not db_results:
        return "Nessun risultato trovato per la tua domanda."

    # Passo 3: LLM formatta la risposta
    response_prompt = f"""Dati i seguenti risultati da un database:
{db_results}

E la domanda originale dell'utente:
{user_question}

Fornisci una risposta chiara e concisa in linguaggio naturale basata su questi risultati. Se i risultati sono vuoti, indica che non è stato trovato nulla.
Risposta:"""

    print("\nGenerazione della risposta in linguaggio naturale...")
    try:
        final_response = ollama.chat(
            model=model_name,
            messages=[
                {
                    'role': 'user',
                    'content': response_prompt,
                },
            ],
            stream=False
        )
        return final_response['message']['content']
    except Exception as e:
        print(f"Errore nella generazione della risposta finale: {e}")
        return "Non sono riuscito a formulare una risposta chiara."

if __name__ == "__main__":
    # Assicurati che il database sia stato creato eseguendo setup_db.py prima
    print("Assicurati che Ollama sia in esecuzione (ollama serve) e che il modello sia scaricato (ollama pull llama3).")

    domande = [
        "Quali prodotti sono disponibili nella categoria Elettronica?",
        "Mostrami i prodotti con un prezzo inferiore a 50 euro.",
        "Quanti Laptop Gaming ci sono in magazzino?",
        "Elenca tutti i prodotti.",
        "Quali libri avete?"
    ]

    for domanda in domande:
        print(f"\n--- Domanda Utente: {domanda} ---")
        risposta = natural_language_query(domanda)
        print(f"Risposta: {risposta}")
        print("----------------------------------")

```

### Passo 3: Eseguire lo Script

Assicurati che il server Ollama sia in esecuzione (`ollama serve`) e che il modello `llama3` (o quello che hai scelto) sia scaricato (`ollama pull llama3`).

Quindi, esegui lo script Python dal tuo terminale:

```bash
python interroga_db.py
```

## Risultato Atteso

Lo script stamperà una serie di domande predefinite e le relative risposte generate dall'LLM, basate sui dati recuperati dal database SQLite. L'LLM agirà come un interprete tra il linguaggio naturale dell'utente e le query SQL, e poi come un formattatore per presentare i risultati in modo leggibile.

Questo esempio mostra come un LLM locale possa fungere da interfaccia intelligente per sistemi di dati locali, mantenendo la privacy e la sicurezza dei dati.