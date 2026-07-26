const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexão com o Banco de Dados SQLite
const db = new sqlite3.Database('./hospital.db', (err) => {
    if (err) console.error('Erro ao conectar ao banco de dados', err.message);
    else console.log('Banco de dados conectado com sucesso.');
});

// Criação da tabela de plantões
db.run(`CREATE TABLE IF NOT EXISTS plantoes (
    data_chave TEXT PRIMARY KEY,
    dados_gerais TEXT,
    saidas TEXT,
    indicadores TEXT
)`);

app.use(express.json());

// Diz ao Express para servir os arquivos estáticos da pasta "public" (HTML, CSS, JS, Imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Rota explícita para a raiz (Abre a tela de login index.html automaticamente)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para buscar os dados do plantão no banco de dados
app.get('/api/plantao/:data', (req, res) => {
    const dataChave = req.params.data;
    db.get(`SELECT * FROM plantoes WHERE data_chave = ?`, [dataChave], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (row) {
            res.json({
                plantao: JSON.parse(row.dados_gerais || '[]'),
                saidas: JSON.parse(row.saidas || '{}'),
                indicadores: JSON.parse(row.indicadores || '{}')
            });
        } else {
            res.json({ plantao: null, saidas: null, indicadores: null });
        }
    });
});

// Rota para salvar os dados do plantão automaticamente no banco
app.post('/api/plantao/:data', (req, res) => {
    const dataChave = req.params.data;
    const { plantao, saidas, indicadores } = req.body;

    db.run(`INSERT INTO plantoes (data_chave, dados_gerais, saidas, indicadores) 
            VALUES (?, ?, ?, ?) 
            ON CONFLICT(data_chave) 
            DO UPDATE SET dados_gerais = ?, saidas = ?, indicadores = ?`,
        [
            dataChave, JSON.stringify(plantao), JSON.stringify(saidas), JSON.stringify(indicadores),
            JSON.stringify(plantao), JSON.stringify(saidas), JSON.stringify(indicadores)
        ],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});