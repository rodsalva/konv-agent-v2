import express from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

// Mock conversation data - in a real scenario, this would come from your agent interactions
const generateConversations = () => {
  const questions = [
    "What specific features on MercadoLivre do you find most valuable for your shopping needs?",
    "How would you rate the user experience and navigation compared to other e-commerce platforms?", 
    "What improvements would you suggest to enhance your shopping experience on MercadoLivre?",
    "How do you typically discover new products and deals on the platform?"
  ];

  const conversations = {
    "tech_enthusiast": {
      name: "Tech Enthusiast Agent",
      emoji: "💻",
      questions_answers: [
        {
          question: questions[0],
          answer: "The technical specification sections are incredibly detailed! I love how I can filter products by exact specs like RAM, processor type, and graphics cards. The comparison tool for electronics is particularly useful - I can compare up to 4 smartphones side-by-side with detailed spec breakdowns. The verified review system where buyers specifically mention performance benchmarks gives me confidence in purchasing decisions."
        },
        {
          question: questions[1], 
          answer: "Navigation is excellent for tech products. The category filters are very granular - I can narrow down to specific sub-categories like 'Gaming Laptops with RTX 4070' or 'Smartphones with 5G and 120Hz displays'. The search algorithm understands technical terms well. Compared to international platforms, MercadoLivre actually has better localized tech specs and pricing in Brazilian Reais, making comparisons easier."
        },
        {
          question: questions[2],
          answer: "I'd love to see more detailed battery life comparisons for mobile devices, and perhaps a 'tech timeline' showing when newer versions of products typically arrive. Also, a notification system for when specific tech specs become available (like when RTX 5080 GPUs launch) would be amazing. Integration with Brazilian tech YouTubers' reviews would add credibility."
        },
        {
          question: questions[3],
          answer: "I follow the 'Eletrônicos' category religiously and have price alerts set up for specific products. The 'Similar products' suggestions often introduce me to newer models I hadn't considered. I also browse the 'Ofertas do Dia' section every morning for flash sales on tech items. The recommendation algorithm has learned my preferences well - it suggests accessories that complement my recent purchases."
        }
      ]
    },
    "budget_shopper": {
      name: "Budget Shopper Agent", 
      emoji: "💰",
      questions_answers: [
        {
          question: questions[0],
          answer: "The price comparison feature is a game-changer! I can see the same product from different sellers with shipping costs included. The 'Ofertas Relâmpago' (flash sales) section saves me tons of money - I've gotten 60% discounts on items I needed. PIX payment discounts are fantastic - an extra 5% off is significant when you're budget-conscious. The installment options (12x sem juros) make expensive items accessible."
        },
        {
          question: questions[1],
          answer: "For budget shopping, it's superior to other platforms. The deal aggregation is excellent - I can filter by discount percentage and see only items with 30%+ off. The shipping cost calculator upfront prevents surprises at checkout. The 'Frete Grátis' filter is essential for staying within budget. Mercado Pago integration makes cashback tracking seamless compared to other payment methods on competitor sites."
        },
        {
          question: questions[2], 
          answer: "I'd love a 'Price History' graph showing how prices fluctuated over time - this would help me know if a current discount is actually good. A 'Bundle Builder' where I can add multiple items and see bulk discounts would be great. More frequent coupon codes and a loyalty program with progressive discounts for frequent buyers would enhance the value proposition."
        },
        {
          question: questions[3],
          answer: "I use price alerts religiously - I set them for items on my wishlist and buy when they hit my target price. I browse by highest discount percentage first, then filter by category. The 'Compre 2, Leve 3' promotions are goldmines. I also follow seasonal patterns - January for electronics clearance, May for Mother's Day deals. Social media groups sharing MercadoLivre coupon codes are invaluable."
        }
      ]
    },
    "gift_buyer": {
      name: "Gift Buyer Agent",
      emoji: "🎁", 
      questions_answers: [
        {
          question: questions[0],
          answer: "The gift wrapping service is convenient - I can choose themed packaging and add personalized messages. Direct shipping to recipients with discrete packaging (no price shown) is perfect for surprises. The gift guides for different occasions (Dia das Mães, Dia dos Pais) help me find appropriate presents. The ability to schedule delivery for specific dates ensures gifts arrive on time for celebrations."
        },
        {
          question: questions[1],
          answer: "For gift shopping, it's quite good but could be better. The gift category organization is helpful, but I wish there were more filters like 'gifts under R$100' or 'gifts for new parents'. The wishlist sharing feature is excellent - recipients can share their wishlists. However, navigation for finding unique, artisanal gifts is limited compared to specialized gift platforms."
        },
        {
          question: questions[2],
          answer: "More gift customization options would be amazing - engraving services, custom photo prints, or personalized packaging. A 'Gift Concierge' service for finding perfect gifts based on recipient interests would be valuable. Better integration with Brazilian cultural celebrations and traditions. Gift tracking should show estimated delivery without revealing the surprise to recipients."
        },
        {
          question: questions[3],
          answer: "I browse by recipient demographics first - 'gifts for her', 'gifts for kids', etc. The trending gifts section shows what's popular for each occasion. I often start with a price range in mind and work backwards. Product reviews mentioning 'bought as a gift' are incredibly helpful. I also check the 'Comprados Juntos' (bought together) suggestions for gift bundle ideas."
        }
      ]
    }
  };

  return conversations;
};

// Get MercadoLivre agent conversations
router.get('/conversations', (req: express.Request, res: express.Response) => {
  try {
    const conversations = generateConversations();
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        title: 'MercadoLivre Multi-Persona Agent Conversations',
        description: 'Research conversations between communication agents and MercadoLivre shopping personas',
        conversations,
        totalAgents: Object.keys(conversations).length,
        questionsPerAgent: 4
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error generating conversations', { error, correlationId: req.correlationId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate conversations',
      correlationId: req.correlationId
    });
  }
});

// Get HTML page displaying conversations
router.get('/conversations/view', (req: express.Request, res: express.Response) => {
  try {
    const conversations = generateConversations();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MercadoLivre Agent Conversations</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
            padding: 30px;
            text-align: center;
            color: #333;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.8;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
        }
        
        .stat {
            background: rgba(255,255,255,0.2);
            padding: 15px 25px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            display: block;
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .conversations {
            padding: 0;
        }
        
        .agent-section {
            border-bottom: 1px solid #eee;
        }
        
        .agent-section:last-child {
            border-bottom: none;
        }
        
        .agent-header {
            background: #f8f9fa;
            padding: 25px 30px;
            border-left: 5px solid #007bff;
        }
        
        .agent-header.tech {
            border-left-color: #28a745;
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        }
        
        .agent-header.budget {
            border-left-color: #ffc107;
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        }
        
        .agent-header.gift {
            border-left-color: #e83e8c;
            background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        }
        
        .agent-name {
            font-size: 1.8em;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .agent-type {
            color: #666;
            font-style: italic;
        }
        
        .qa-list {
            padding: 0 30px 30px 30px;
        }
        
        .qa-item {
            margin-bottom: 30px;
            background: #f8f9fa;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid #e9ecef;
        }
        
        .question {
            background: #007bff;
            color: white;
            padding: 20px;
            font-weight: 600;
            position: relative;
        }
        
        .question::before {
            content: "Q" counter(question-counter) ":";
            counter-increment: question-counter;
            font-weight: bold;
            margin-right: 10px;
            background: rgba(255,255,255,0.2);
            padding: 5px 10px;
            border-radius: 5px;
        }
        
        .answer {
            padding: 25px;
            line-height: 1.6;
            background: white;
            position: relative;
        }
        
        .answer::before {
            content: "💬";
            position: absolute;
            left: 25px;
            top: 0;
            transform: translateY(-50%);
            background: white;
            padding: 0 10px;
            font-size: 1.2em;
        }
        
        .timestamp {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 10px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .stats {
                flex-direction: column;
                gap: 15px;
            }
            
            .conversations, .qa-list {
                padding: 20px;
            }
        }
    </style>
    <style>
        .agent-section { counter-reset: question-counter; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 MercadoLivre Agent Research</h1>
            <p>Multi-Persona Shopping Experience Analysis</p>
            <div class="stats">
                <div class="stat">
                    <span class="stat-number">3</span>
                    <span class="stat-label">Persona Agents</span>
                </div>
                <div class="stat">
                    <span class="stat-number">4</span>
                    <span class="stat-label">Questions Each</span>
                </div>
                <div class="stat">
                    <span class="stat-number">12</span>
                    <span class="stat-label">Total Insights</span>
                </div>
            </div>
        </div>
        
        <div class="conversations">
            ${Object.entries(conversations).map(([key, agent]) => `
                <div class="agent-section">
                    <div class="agent-header ${key.includes('tech') ? 'tech' : key.includes('budget') ? 'budget' : 'gift'}">
                        <div class="agent-name">${agent.emoji} ${agent.name}</div>
                        <div class="agent-type">${key.replace('_', ' ').toUpperCase()} PERSONA</div>
                    </div>
                    <div class="qa-list">
                        ${agent.questions_answers.map((qa, index) => `
                            <div class="qa-item">
                                <div class="question">
                                    ${qa.question}
                                </div>
                                <div class="answer">
                                    ${qa.answer}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            Generated on ${new Date().toLocaleString('pt-BR', { 
              timeZone: 'America/Sao_Paulo',
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} (Brazil Time)
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Error generating conversation view', { error, correlationId: req.correlationId });
    res.status(500).send('<h1>Error generating conversation view</h1>');
  }
});

// Get departmental recommendations
router.get('/departments', (req: express.Request, res: express.Response) => {
  try {
    const departmentalData = generateDepartmentalRecommendations();
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: departmentalData,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error generating departmental recommendations', { error, correlationId: req.correlationId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate departmental recommendations',
      correlationId: req.correlationId
    });
  }
});

// Get HTML page displaying departmental recommendations
router.get('/departments/view', (req: express.Request, res: express.Response) => {
  try {
    const departmentalData = generateDepartmentalRecommendations();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MercadoLivre Departmental Recommendations</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .executive-summary {
            background: #f8f9fa;
            padding: 30px;
            border-bottom: 3px solid #28a745;
        }
        
        .executive-summary h2 {
            color: #28a745;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .priorities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .priority-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            border-left: 5px solid #28a745;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .priority-number {
            background: #28a745;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .departments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 30px;
            padding: 30px;
        }
        
        .department-card {
            background: #f8f9fa;
            border-radius: 15px;
            overflow: hidden;
            border: 1px solid #dee2e6;
            transition: transform 0.3s ease;
        }
        
        .department-card:hover {
            transform: translateY(-5px);
        }
        
        .department-header {
            padding: 25px;
            color: white;
            font-weight: 600;
            font-size: 1.3em;
        }
        
        .department-header.product { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); }
        .department-header.engineering { background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); }
        .department-header.marketing { background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: #333; }
        .department-header.customer-service { background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%); }
        .department-header.business-intelligence { background: linear-gradient(135deg, #6f42c1 0%, #59359a 100%); }
        .department-header.operations { background: linear-gradient(135deg, #e83e8c 0%, #e21e7b 100%); }
        
        .department-content {
            padding: 25px;
            background: white;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section h4 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 1.1em;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 8px;
        }
        
        .action-list {
            list-style: none;
            padding: 0;
        }
        
        .action-list li {
            background: #f8f9fa;
            margin: 8px 0;
            padding: 12px 15px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            position: relative;
        }
        
        .action-list li::before {
            content: "✓";
            color: #28a745;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .kpi-tag {
            display: inline-block;
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.85em;
            margin: 2px;
        }
        
        .timeline-badge {
            background: #fff3cd;
            color: #856404;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: 600;
        }
        
        .impact-badge {
            background: #d1ecf1;
            color: #0c5460;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: 600;
        }
        
        .footer {
            background: #343a40;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .departments-grid {
                grid-template-columns: 1fr;
                padding: 20px;
            }
            
            .priorities-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 MercadoLivre Departmental Strategy</h1>
            <p>AI-Generated Insights & Actionable Recommendations</p>
        </div>
        
        <div class="executive-summary">
            <h2>📋 Executive Summary</h2>
            <p><strong>Expected ROI:</strong> 15-25% improvement in key metrics within 6 months</p>
            <p><strong>Implementation Budget:</strong> R$ 800K - 1.2M for full implementation</p>
            <p><strong>Resource Requirements:</strong> 15-20 engineering months, 3-4 designers, 2 senior PMs</p>
            
            <div class="priorities-grid">
                <div class="priority-card">
                    <div class="priority-number">1</div>
                    <h3>Enhanced Product Discovery</h3>
                    <p><span class="timeline-badge">3 months</span> <span class="impact-badge">High conversion impact</span></p>
                    <p>Departments: Product, Engineering</p>
                </div>
                <div class="priority-card">
                    <div class="priority-number">2</div>
                    <h3>Persona-Based Personalization</h3>
                    <p><span class="timeline-badge">6 months</span> <span class="impact-badge">Engagement & retention</span></p>
                    <p>Departments: Marketing, Product, BI</p>
                </div>
                <div class="priority-card">
                    <div class="priority-number">3</div>
                    <h3>Gift Experience Enhancement</h3>
                    <p><span class="timeline-badge">4 months</span> <span class="impact-badge">Higher order value</span></p>
                    <p>Departments: Product, Operations</p>
                </div>
            </div>
        </div>
        
        <div class="departments-grid">
            ${Object.entries(departmentalData.departments).map(([key, dept]) => `
                <div class="department-card">
                    <div class="department-header ${key.replace('_', '-')}">
                        ${dept.icon} ${dept.name}
                    </div>
                    <div class="department-content">
                        <div class="section">
                            <h4>🎯 Immediate Actions</h4>
                            <ul class="action-list">
                                ${dept.immediate_actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="section">
                            <h4>🚀 Medium-term Initiatives</h4>
                            <ul class="action-list">
                                ${dept.medium_term_initiatives.map(initiative => `<li>${initiative}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="section">
                            <h4>📊 Key Performance Indicators</h4>
                            <div>
                                ${dept.kpis.map(kpi => `<span class="kpi-tag">${kpi}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            Generated by MercadoLivre AI Agent Analysis System | ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Error generating departmental view', { error, correlationId: req.correlationId });
    res.status(500).send('<h1>Error generating departmental view</h1>');
  }
});

function generateDepartmentalRecommendations() {
  return {
    title: "MercadoLivre Departmental Recommendations",
    subtitle: "Strategic Action Plan Based on Multi-Persona Analysis",
    departments: {
      product_department: {
        name: "Product Department",
        icon: "🎯",
        immediate_actions: [
          "Implement price history graphs for all products",
          "Enhance battery life comparison tools for electronics", 
          "Create 'Bundle Builder' for bulk discount discovery",
          "Develop gift customization options (engraving, personalization)"
        ],
        medium_term_initiatives: [
          "Build AI-powered product recommendation engine",
          "Create specialized landing pages for different personas",
          "Implement predictive deal alert system",
          "Develop cultural gift suggestion algorithms"
        ],
        kpis: [
          "Product discovery conversion rate",
          "Average time to purchase decision", 
          "Cross-sell/upsell effectiveness",
          "Return rate reduction"
        ]
      },
      engineering_department: {
        name: "Engineering Department", 
        icon: "⚙️",
        immediate_actions: [
          "Optimize mobile experience performance (75% of traffic)",
          "Implement real-time price comparison algorithms",
          "Build advanced filtering and search capabilities",
          "Create personalization engine infrastructure"
        ],
        medium_term_initiatives: [
          "Enhanced product specification display system",
          "Advanced recommendation algorithm development", 
          "Price tracking and alert notification system",
          "Gift workflow optimization backend"
        ],
        kpis: [
          "Mobile page load speed",
          "Search result relevance score",
          "API response times",
          "System uptime & reliability"
        ]
      },
      marketing_department: {
        name: "Marketing Department",
        icon: "📢", 
        immediate_actions: [
          "Target tech enthusiasts with spec-heavy product showcases",
          "Create budget-focused flash sale campaigns",
          "Develop seasonal gift marketing campaigns", 
          "Leverage PIX discount messaging for conversion"
        ],
        medium_term_initiatives: [
          "Create tech review integration partnerships",
          "Develop gift guides for Brazilian cultural celebrations",
          "Build educational content about deal hunting strategies",
          "Produce comparison-focused product videos"
        ],
        kpis: [
          "Campaign conversion rates by persona",
          "Email open & click rates",
          "Social media engagement",
          "Brand awareness metrics"
        ]
      },
      customer_service_department: {
        name: "Customer Service Department",
        icon: "🎧",
        immediate_actions: [
          "Tech specification knowledge training for electronics support",
          "Gift service protocols and customization options training",
          "Deal and promotion explanation training",
          "Payment method optimization guidance"
        ],
        medium_term_initiatives: [
          "Self-service price comparison tools",
          "Automated gift tracking and communication",
          "Proactive deal alert customer education", 
          "Enhanced return process for gifts"
        ],
        kpis: [
          "First contact resolution rate",
          "Customer satisfaction scores",
          "Average response time",
          "Ticket volume reduction"
        ]
      },
      business_intelligence_department: {
        name: "Business Intelligence Department", 
        icon: "📊",
        immediate_actions: [
          "Persona-based conversion funnel analysis",
          "Price sensitivity modeling by category",
          "Gift season demand forecasting",
          "Mobile vs desktop behavior analysis"
        ],
        medium_term_initiatives: [
          "Real-time persona segmentation",
          "Predictive pricing optimization models",
          "Customer lifetime value by shopping behavior",
          "A/B testing framework for persona experiences"
        ],
        kpis: [
          "Data accuracy & completeness",
          "Report generation speed",
          "Insight actionability score",
          "Predictive model accuracy"
        ]
      },
      operations_department: {
        name: "Operations Department",
        icon: "🚚",
        immediate_actions: [
          "Tech product lifecycle management optimization",
          "Seasonal gift inventory planning enhancement",
          "Deal merchandise strategic stocking",
          "Popular product availability monitoring"
        ],
        medium_term_initiatives: [
          "Gift delivery service enhancement",
          "Express shipping optimization for deals",
          "Packaging customization capabilities",
          "Return process streamlining"
        ],
        kpis: [
          "Inventory turnover rates",
          "Delivery time performance",
          "Return processing efficiency",
          "Vendor relationship scores"
        ]
      }
    }
  };
}

export default router; 