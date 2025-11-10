import { NextResponse } from 'next/server';
import { Client } from 'langsmith';

export const runtime = 'nodejs';


export async function GET() {
  try {
    const orgId = process.env.LANGSMITH_ORG_ID || 'bf93fa62-c7ff-4e1c-bfa4-437a12c120f0';
    
    const workspacesResponse = await fetch('https://api.smith.langchain.com/api/v1/workspaces', {
      headers: {
        'X-API-Key': process.env.LANGSMITH_API_KEY!,
        'X-Organization-Id': orgId,
      },
    });
    
    const workspaces = await workspacesResponse.json();
    
    return NextResponse.json({ 
      success: true,
      workspaces,
      message: 'Workspaces fetched successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

// export async function GET() {
//   try {
//     // Test LangSmith connection
//     const client = new Client({
//       apiKey: process.env.LANGSMITH_API_KEY,
//       apiUrl: process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
//     });

//     // Create a test trace
//     const run = await client.createRun({
//       name: 'test-trace',
//       run_type: 'chain',
//       inputs: { test: 'Hello from test endpoint' },
//     });

//     await client.endRun(run.id, { 
//       outputs: { result: 'Test trace successful' } 
//     });

//     return NextResponse.json({ 
//       success: true, 
//       message: 'Test trace created successfully',
//       runId: run.id,
//       env: {
//         hasApiKey: !!process.env.LANGSMITH_API_KEY,
//         hasTracing: process.env.LANGSMITH_TRACING,
//         endpoint: process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
//       }
//     });
//   } catch (error: any) {
//     return NextResponse.json({ 
//       success: false, 
//       error: error.message,
//       stack: error.stack,
//       env: {
//         hasApiKey: !!process.env.LANGSMITH_API_KEY,
//         hasTracing: process.env.LANGSMITH_TRACING,
//       }
//     }, { status: 500 });
//   }
// }