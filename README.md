# AI Chat UI

A Next.js application for visualizing and interacting with AI chat messages across multiple UI formats (Pega, Adaptive Cards, A2UI, and json-render).

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure OpenAI account with API access
- Azure AD application registration (for authentication)

### Installation

1. Clone the repository:

```bash
git clone git@github.com:ricmars/chat-visualizer.git
cd ai-chat-ui
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

4. Configure environment variables in `.env`:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/

# Azure AD Configuration (for authentication)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Running the Application

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to:

```
http://localhost:3100
```

The application will be available on port 3100 by default.

### Available Scripts

- `npm run dev` - Start development server on port 3100
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint and TypeScript type checking
- `npm run gen-schema` - Generate JSON schema from TypeScript types

## Features

- **Multiple UI Format Support**: Transform chat messages to Pega, Adaptive Cards, A2UI, or json-render formats
- **Streaming Support**: Real-time streaming of AI responses
- **Interactive Previews**: Visualize different format outputs side-by-side
- **Case Management**: Support for workflow and case visualization

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/src/components` - React components
- `/src/lib` - Core libraries, transformers, and utilities
- `/src/lib/transformers` - Format transformers (Pega, Adaptive Cards, A2UI, json-render)
- `/public/samples` - Sample JSON files for each format
