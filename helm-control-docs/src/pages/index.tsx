/**
 * Helm Control Documentation - Home Page
 */

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <main>
        <h1>Helm Control</h1>
        <p className="subtitle">
          Infrastructure for Safe, Deployable AI Operators
        </p>
        
        <div className="grid">
          <div className="card">
            <h2>🚀 Quick Start</h2>
            <p>Get up and running in minutes with our simple SDK.</p>
            <Link href="/docs/quick-start">Get Started →</Link>
          </div>
          
          <div className="card">
            <h2>📚 API Reference</h2>
            <p>Complete API documentation and examples.</p>
            <Link href="/docs/api">View API →</Link>
          </div>
          
          <div className="card">
            <h2>🔧 Integration Guides</h2>
            <p>Step-by-step integration tutorials.</p>
            <Link href="/docs/integration">View Guides →</Link>
          </div>
          
          <div className="card">
            <h2>💡 Examples</h2>
            <p>Real-world usage examples and patterns.</p>
            <Link href="/docs/examples">See Examples →</Link>
          </div>
        </div>
        
        <div className="features">
          <h2>Key Features</h2>
          <ul>
            <li>✅ Runtime governance and safety enforcement</li>
            <li>✅ Permission-based skill management</li>
            <li>✅ Enterprise-grade audit logging</li>
            <li>✅ Stability monitoring and auto-recovery</li>
            <li>✅ Multi-environment deployment</li>
            <li>✅ TypeScript-first development</li>
          </ul>
        </div>
      </main>
      
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        main {
          text-align: center;
        }
        
        h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
          font-size: 1.5rem;
          color: #666;
          margin-bottom: 3rem;
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .card {
          padding: 2rem;
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          text-align: left;
          transition: transform 0.2s;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .card h2 {
          margin-bottom: 1rem;
          color: #333;
        }
        
        .card p {
          color: #666;
          margin-bottom: 1.5rem;
        }
        
        .card a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }
        
        .card a:hover {
          text-decoration: underline;
        }
        
        .features {
          text-align: left;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .features h2 {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .features ul {
          list-style: none;
          padding: 0;
        }
        
        .features li {
          padding: 0.5rem 0;
          color: #555;
        }
      `}</style>
    </div>
  );
}
