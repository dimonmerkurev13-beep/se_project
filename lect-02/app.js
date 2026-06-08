const HOST = "localhost", PORT = 3000;
const express = require('express');
const fs = require('fs');
const path = require('path');

// Путь к файлу с играми
const gamesPath = path.join(__dirname, 'json', 'games.json');

// 1 - настройка веб-приложения
const app = express();
app.set('view engine', 'ejs');
app.use('/css', express.static('css'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2 - описание бизнес-логики + модели данных
const getGames = () => JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
const saveGames = (games) => fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2));

const getModelGames = (req) => {
    return { 
        field: req.body?.field ?? 'title', 
        direct: req.body?.direct ?? 'asc',
        arrayGames: [],
        ratingLimit: req.body?.ratingLimit ?? 85
    };
}

const getModelGame = (req) => {
    return { 
        id: req.body?.gameId ?? -1,
        title: req.body?.title ?? '',
        genre: req.body?.genre ?? '',
        rating: req.body?.rating ?? 0
    };
}

// Создание папки и файла если не существует
const jsonDir = path.join(__dirname, 'json');
if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir);
}
if (!fs.existsSync(gamesPath)) {
    const defaultGames = [
        { id: 1, title: 'The Witcher 3', genre: 'RPG', rating: 95 },
        { id: 2, title: 'Cyberpunk 2077', genre: 'RPG', rating: 78 },
        { id: 3, title: 'Counter-Strike 2', genre: 'Shooter', rating: 88 },
        { id: 4, title: 'Baldur\'s Gate 3', genre: 'RPG', rating: 96 },
        { id: 5, title: 'Dota 2', genre: 'MOBA', rating: 82 }
    ];
    saveGames(defaultGames);
    console.log('Файл games.json создан');
}

// 3 - маршрутизация

// 3.1 - маршруты для коллекции игр
app.get(['/games', '/'], (req, res) => {
    const model = getModelGames(req);
    model.arrayGames = getGames();
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.render('vGames.ejs', model);
});

app.post('/games/order', (req, res) => {
    const model = getModelGames(req);
    const f = model.field, d = model.direct == 'asc' ? 1 : -1;
    model.arrayGames = getGames();
    model.arrayGames.sort((a, b) => { 
        if (a[f] < b[f]) return -d;
        if (a[f] > b[f]) return d;
        return 0;
    });
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.render('vGames.ejs', model);
});

// 3.2 - маршруты для отдельной игры
app.get('/game/addGame', (req, res) => {
    const model = getModelGame(req);
    model.btnDo = "saveGame";
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.render('vGame.ejs', model);
});

app.post('/game/saveGame', (req, res) => {
    const newGame = getModelGame(req);
    const games = getGames();
    const maxId = Math.max(...games.map(game => game.id));
    newGame.id = maxId + 1;
    games.push(newGame);
    saveGames(games);
    res.redirect('/games');
});

app.post('/game/editGame', (req, res) => {
    const gameId = req.body.gameId;
    const games = getGames();
    const model = games.find(game => game.id == gameId);
    model.btnDo = "updateGame";
    res.render('vGame.ejs', model);
});

app.post('/game/updateGame', (req, res) => {
    const gameUp = getModelGame(req);
    const games = getGames();
    const index = games.findIndex(game => game.id == gameUp.id);
    games[index] = gameUp;
    saveGames(games);
    res.redirect('/games');
});

app.post('/game/delGame', (req, res) => { 
    const gameId = parseInt(req.body.gameId);
    
    if (isNaN(gameId)) {
        return res.status(400).send('Неверный ID игры');
    }
    
    let games = getGames();
    const gameIndex = games.findIndex(game => +game.id === +gameId);
    
    if (gameIndex === -1) {
        return res.status(404).send('Игра не найдена');
    }
    
    const deletedGame = games[gameIndex];
    games.splice(gameIndex, 1);
    saveGames(games);
    
    console.log(`Удалена игра: ${deletedGame.title} (ID: ${gameId})`);
    
    res.redirect('/games');
});

// 4 - запуск сервера
app.listen(PORT, HOST, () => {
    console.log(`Веб-приложение для работы с коллекцией игр.`);
    printRoutes();
    console.log(`http://${HOST}:${PORT}/`);
});

const printRoutes = () => {
    console.group('=> Маршруты для /games');
    console.log('  GET    /games                                 - Показать все игры');
    console.log('  POST   /games/order?field=title&direct=asc    - Показать с сортировкой');
    console.groupEnd();
    
    console.log('');
    
    console.group('=> Маршруты для /game');
    console.log('  GET    /game/addGame    - Добавить игру');
    console.log('  POST   /game/saveGame   - Сохранить игру');
    console.log('  POST   /game/editGame   - Редактировать игру');
    console.log('  POST   /game/updateGame - Сохранить изменения');
    console.log('  POST   /game/delGame    - Удалить игру');
    console.groupEnd();
}