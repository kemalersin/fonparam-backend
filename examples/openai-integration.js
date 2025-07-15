// OpenAI API ile FonParam MCP Integration
// npm install openai axios

const OpenAI = require('openai');
const axios = require('axios');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// FonParam MCP Server base URL
const MCP_BASE_URL = 'https://api.fonapram.com:3001';

// FonParam MCP tools as OpenAI functions
const fonparamFunctions = [
    {
        name: 'analyze_fund_investment',
        description: 'Türk yatırım fonları için kapsamlı yatırım analizi yapar. Enflasyon etkisi, getiri hesaplaması ve yatırım tavsiyeleri içerir.',
        parameters: {
            type: 'object',
            properties: {
                fundCode: {
                    type: 'string',
                    description: 'Fon kodu (örn: AAK, DAH, PKF)'
                },
                initialInvestment: {
                    type: 'number',
                    description: 'Başlangıç yatırım tutarı (TL)'
                },
                monthlyInvestment: {
                    type: 'number',
                    description: 'Aylık düzenli yatırım tutarı (TL, opsiyonel)'
                },
                startDate: {
                    type: 'string',
                    description: 'Analiz başlangıç tarihi (last_1_year, last_3_years, year_start vb.)'
                },
                yearlyIncrease: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['percentage', 'amount'] },
                        value: { type: 'number' }
                    },
                    description: 'Yıllık artış oranı (opsiyonel)'
                }
            },
            required: ['fundCode', 'initialInvestment', 'startDate']
        }
    },
    {
        name: 'compare_funds',
        description: 'Birden fazla yatırım fonunu karşılaştırır ve hangisinin daha iyi performans gösterdiğini analiz eder.',
        parameters: {
            type: 'object',
            properties: {
                fundCodes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Karşılaştırılacak fon kodları listesi'
                },
                metrics: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Karşılaştırma metrikleri (return, risk, sharpe vb.)'
                },
                period: {
                    type: 'string',
                    description: 'Karşılaştırma periyodu (short_term, long_term)'
                }
            },
            required: ['fundCodes']
        }
    },
    {
        name: 'get_market_insights',
        description: 'Fon piyasası hakkında genel bilgiler, trendler ve piyasa analizi sağlar.',
        parameters: {
            type: 'object',
            properties: {
                fundType: {
                    type: 'string',
                    description: 'Fon tipi (hisse_senedi, altin, karma vb.)'
                },
                timeframe: {
                    type: 'string',
                    description: 'Zaman dilimi (daily, monthly, yearly)'
                },
                limit: {
                    type: 'number',
                    description: 'Gösterilecek fon sayısı'
                }
            }
        }
    }
];

// Function to call FonParam MCP server
async function callFonParamMCP(toolName, args) {
    try {
        const response = await axios.post(`${MCP_BASE_URL}/mcp/tools/${toolName}`, {
            arguments: args,
            id: Date.now().toString()
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.FONPARAM_API_KEY || ''
            }
        });

        return response.data.result.content[0].text;
    } catch (error) {
        console.error(`FonParam MCP Error:`, error.response?.data || error.message);
        return `FonParam analiz hatası: ${error.message}`;
    }
}

// Main chat function
async function chatWithFonParamAI(userMessage, conversationHistory = []) {
    try {
        const messages = [
            {
                role: 'system',
                content: `Sen Türkiye'deki yatırım fonları konusunda uzman bir finansal danışmansın. 
                         FonParam API'si üzerinden gerçek fon verilerine erişimin var.
                         Kullanıcılara yatırım önerileri verirken:
                         1. Önce ilgili fonları analiz et
                         2. Risk seviyesini değerlendir
                         3. Enflasyon etkisini hesaba kat
                         4. Portföy diversifikasyonu öner
                         5. Kısa ve uzun vadeli projeksiyonlar yap
                         
                         Her zaman samimi, profesyonel ve anlaşılır bir dil kullan.`
            },
            ...conversationHistory,
            {
                role: 'user',
                content: userMessage
            }
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: messages,
            functions: fonparamFunctions,
            function_call: 'auto',
            temperature: 0.7,
            max_tokens: 2000
        });

        const message = response.choices[0].message;

        // If AI wants to call a function
        if (message.function_call) {
            const functionName = message.function_call.name;
            const functionArgs = JSON.parse(message.function_call.arguments);
            
            console.log(`🔍 FonParam MCP çağrısı: ${functionName}`, functionArgs);
            
            // Call FonParam MCP server
            const functionResult = await callFonParamMCP(functionName, functionArgs);
            
            // Get AI's response to the function result
            const followUpResponse = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    ...messages,
                    message,
                    {
                        role: 'function',
                        name: functionName,
                        content: functionResult
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            return {
                response: followUpResponse.choices[0].message.content,
                functionCalled: functionName,
                functionArgs: functionArgs,
                functionResult: functionResult
            };
        } else {
            return {
                response: message.content,
                functionCalled: null
            };
        }

    } catch (error) {
        console.error('OpenAI API Error:', error);
        return {
            response: 'Üzgünüm, şu anda bir teknik sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
            error: error.message
        };
    }
}

// Example usage
async function main() {
    console.log('🤖 FonParam AI Danışmanı Başlatılıyor...\n');

    // Example conversation
    const examples = [
        "AAK fonu ile 10.000 TL başlangıç yatırımı yaparak aylık 1.000 TL düzenli yatırım yapsam ne olur?",
        "En iyi performans gösteren 3 fonu karşılaştır",
        "Şu an fon piyasası nasıl? Altın fonları almaya değer mi?",
        "Risk seviyesi düşük, uzun vadeli yatırım için hangi fonları önerirsin?"
    ];

    for (const question of examples) {
        console.log(`👤 Kullanıcı: ${question}`);
        
        const result = await chatWithFonParamAI(question);
        
        console.log(`🤖 AI Danışman: ${result.response}`);
        
        if (result.functionCalled) {
            console.log(`📊 Kullanılan Analiz: ${result.functionCalled}`);
        }
        
        console.log('\n' + '='.repeat(80) + '\n');
    }
}

// Export for use in other applications
module.exports = {
    chatWithFonParamAI,
    callFonParamMCP,
    fonparamFunctions
};

// Run example if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
} 