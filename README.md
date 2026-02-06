# Lorph

![Lorph](images/Lorph.png)

1. ![Lorph1](images/Lorph1.webp)
2. ![Lorph2](images/Lorph2.webp)
3. ![Lorph3](images/Lorph3.webp)
4. ![Lorph4](images/Lorph4.webp)
5. ![Lorph5](images/Lorph5.webp)


Lorph is an advanced AI chat application designed for interactive communication with various cloud-based Large Language Models (LLMs) via the Ollama framework. This project integrates robust file processing capabilities, enabling the extraction of textual content from diverse document types, and incorporates web search functionalities to provide contextually rich and accurate responses.

## Key Features

*   **Multi-Model AI Chat**: Seamless interaction with a selection of powerful cloud LLMs through Ollama.
*   **Comprehensive File Processing**: Supports text extraction from images (OCR), PDF documents, Microsoft Word (.docx), and Excel (.xlsx) files, enhancing contextual understanding for AI responses.
*   **Dynamic Web Search Integration**: Leverages real-time web search to augment AI responses with current and relevant information.
*   **Intuitive User Interface**: Features a responsive chat interface with chat history management, dynamic model selection, and file attachment capabilities.

## Installation and Setup

Follow these steps to get the Lorph application running on your local machine.

### Step 1: Clone the Repository

```bash
git clone https://github.com/AL-MARID/Lorph.git
cd Lorph
```

### Step 2: Configure Ollama and API Key

Lorph requires the Ollama client to connect to cloud models and an API key for authentication.

#### Prerequisites

1.  **Ollama Account**: Create an account at [Ollama](https://ollama.com).
2.  **Email Verification**: Verify your registered email address.
3.  **Login Credentials**: Have your Ollama login credentials readily available.

#### Manual Ollama Installation

Install the Ollama client on your local machine.

*   **Linux & macOS**: `curl -fsSL https://ollama.com/install.sh | sh`
*   **Windows**: Download from [ollama.com/download/windows](https://ollama.com/download/windows)

#### Ollama Server and Login

1.  **Start Ollama Server**: In a new terminal, initiate the server process:
    ```bash
    ollama serve
    ```
2.  **Device Pairing & Login**: In a separate terminal, authenticate your device:
    ```bash
    ollama signin
    ```
    Follow the on-screen instructions to open the authentication URL and connect your device.

#### API Key Configuration

To enable Lorph to connect with Ollama's cloud models, an API key must be configured.

1.  **Generate API Key**: After completing the device pairing, generate a new API key from your Ollama settings: [ollama.com/settings/keys](https://ollama.com/settings/keys).
2.  **Create `.env.local` file**: In the root of the Lorph project directory, create a new file named `.env.local`.
3.  **Add API Key**: Insert the generated key into the `.env.local` file. The environment variable name must be `OLLAMA_CLOUD_API_KEY`.
    ```
    OLLAMA_CLOUD_API_KEY=your_api_key_here
    ```

### Step 3: Install Dependencies

Use your preferred package manager to install the necessary project dependencies.

```bash
# Using npm
npm install

# Or using pnpm
pnpm install

# Or using yarn
yarn install
```

### Step 4: Build and Run the Application

1.  **Build the project**:
    ```bash
    pnpm build
    ```
2.  **Run the application**:
    ```bash
    pnpm start
    ```

Access the application by navigating to `http://localhost:3000` in your web browser.

## Technical Details

### Supported Cloud Models

The system is configured to interact with a diverse range of powerful, cloud-based LLMs through the Ollama framework.

| Model Name                 | Description                                     |
| :------------------------- | :---------------------------------------------- |
| `deepseek-v3.1:671b-cloud` | A large-scale model for general tasks.          |
| `gpt-oss:20b-cloud`        | Open-source GPT variant (20B parameters).       |
| `gpt-oss:120b-cloud`       | Open-source GPT variant (120B parameters).      |
| `kimi-k2:1t-cloud`         | A massive model known for its context handling. |
| `qwen3-coder:480b-cloud`   | Specialized model for coding and development tasks. |
| `glm-4.6:cloud`            | General language model.                         |
| `glm-4.7:cloud`            | General language model (updated version).       |
| `minimax-m2:cloud`         | High-performance model.                         |
| `mistral-large-3:675b-cloud` | A powerful model from the Mistral family.       |

### Technology Stack

Lorph leverages a modern and robust technology stack to deliver its features:

| Category | Technology | Version |
| :--- | :--- | :--- |
| Framework | React | 19.2.4 |
| Language | TypeScript | 5.8.2 |
| Build Tool | Vite | 7.3.1 |
| Styling | Tailwind CSS | CDN (Runtime) |
| Icons | Lucide React | 0.563.0 |
| Markdown Rendering | React Markdown | 10.1.0 |
| Markdown Extensions | remark-gfm | 4.0.1 |
| Syntax Highlighting | React Syntax Highlighter | 16.1.0 |
| PDF Processing | PDF.js | 3.11.174 |
| OCR Engine | Tesseract.js | 5.0.4 |
| Word Document Parsing | Mammoth | 1.6.0 |
| Excel File Parsing | read-excel-file | 5.7.1 |

### File Processing Capabilities

The application extracts text content from attached files and includes it in the conversation context, enabling the AI to process and respond based on the document's information.

| Format | Processing Method |
| :--- | :--- |
| Images (JPEG, PNG) | OCR text extraction via Tesseract.js (English language) |
| PDF | Multi-page text extraction via PDF.js with page-by-page output |
| Word (DOCX) | Raw text extraction via Mammoth |
| Excel (XLSX) | Row-column parsing with pipe-delimited output via read-excel-file |
| Plaintext (TXT, MD, JSON, CSV, JS, TS, TSX, JSX, PY) | Direct file read |

### Web Search Integration

The web search functionality in Lorph is engineered with a multi-layered architecture to ensure efficient and accurate information retrieval:

1.  **Data Acquisition Layer**: Handles raw HTTP requests and employs proxy rotation (using services like allorigins, corsproxy.io, and codetabs) to overcome potential access restrictions and ensure reliable data fetching.
2.  **Processing Layer**: Focuses on transforming raw HTML data into a queryable Document Object Model (DOM), including URL sanitization and resolution of redirects to obtain clean and usable links.
3.  **Knowledge Extraction Layer**: Extracts relevant entities and information from various sources, including structured data from the Wikipedia OpenSearch API and unstructured content from DuckDuckGo HTML DOM.
4.  **Orchestration Layer**: Manages the overall search workflow, performing parallel data fetching, merging results from different sources, deduplicating entries based on normalized URLs, and classifying results by type (e.g., web, video).

## Contributing

Contributions to the Lorph project are welcome. For suggestions, feature enhancements, or bug fixes, please adhere to the following workflow:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Implement your changes and commit them (`git commit -m 'Add some feature'`).
4.  Push your branch to your fork (`git push origin feature/YourFeature`).
5.  Open a Pull Request to the main repository.

## License

This project is distributed under the MIT License. Refer to the [LICENSE](LICENSE) file for complete details.
