//cautam prin node_modules anumite pachete
//care contin "uneltele care o sa ne ajute"
const express = require('express');
const QRCode = require('qrcode');
const path = require('path'); // Ne ajuta sa construim caile catre fisiere corect

//deci express este o functie mare pe care o punem
// in app ,deci de acum app este seful
const app = express();
const port = 3000;

//1.middleware(configurari)
//permitem serverlui sa primeasca date JSON
//de la frontend
app.use(express.json());

//Folosim pentru fisierele din folderul public
//app.use express.static
app.use(express.static('public'));

//baza de date temporara(memorie)
//aici tinem cererile cat timp serverlul este deschis
const requests = [];

// --- RUTELE PENTRU PAGINI HTML (Frontend) ---

//ruta de test- doar ca sa vedem ca frontend-ul 
//comunica cu backend-ul

// Cand intram pe site, mergem la Dashboard (in folderul QRcode)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/QRcode/index.html');
});

// Ruta pentru Login (in folderul Login)
// NOTA: Am corectat 'LogIIn' in 'Login'. Asigura-te ca folderul tau se numeste 'Login'.
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/Login/login.html');
});

// Ruta pentru pagina de Plata (aceasta este accesata cand scanezi QR-ul)
// Link-ul generat este http://localhost:3000/pay/ID
app.get('/pay/:id', (req, res) => {
    // Aici trebuie sa ai un fisier pay.html in folderul public/Pay sau similar
    // Am presupus calea: public/Pay/pay.html
    res.sendFile(__dirname + '/public/PayRequest/pay.html'); 
});



app.get('/api/test', (req, res) => {
    console.log("Apelam ruta!");
    res.json({
        mesaj: "Conexiunea cu serverul a reusit!",
        timestamp: new Date()
    });
});

//noua ruta (creearea cererilor)
//ruta primeste suma si motivul si creeaza link-ul
app.post('/api/create-request', async (req, res) => {
    //datele trimise de frontend(suma si motivul)
    const { amount, reason, currency, creator } = req.body;

    //verificam sa nu fie goale
    if (!amount || !reason) {
        return res.status(400).json({
            error: "Specifica suma si motivul !"
        });
    }

    //generam un id unic (folosim timpul curent)
    const id = Date.now().toString();



    const ipCalculator = '192.168.1.12';
    //construim link-ul (care duce catre ruta app.get('/pay/:id') definita mai sus)
    const linkPlata = `http://${ipCalculator}:3000/pay/${id}`;
    
    //Daca nu alege,setam ron,ca valuta standard
    const monedaAleasa = currency || 'RON';

    try {
        const qrImage = await QRCode.toDataURL(linkPlata);
        
        //cream un pachet de date
        const newRequest = {
            _id: id,                 // Folosim _id
            amount: parseFloat(amount),
            reason: reason,
            currency: monedaAleasa,
            link: linkPlata,   // Salvam si linkul
            qrCode: qrImage,   // Salvam si imaginea QR
            status: 'active',
            createdAt: new Date(),
            createdBy: creator || 'Anonim', // Cine a facut cererea
            transactions: [],       // Lista de plati/refuzuri
            totalCollected: 0       // Cati bani s-au strans
        };

        requests.push(newRequest);

        console.log("Am creat o cerere noua", newRequest);

        //Trimitem inapoi link-ul si poza
        res.json({
            success: true,
            id: id,
            link: linkPlata,
            qrCode: qrImage
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Eroare la generarea QR" });
    }
});

//ruta care trimite detalii cererii cate pay.html
// Am decomentat aceasta ruta pentru ca pay.html sa poata cere detaliile (suma, motiv)
app.get('/api/get-request/:id', (req, res) => {
    const idCautat = req.params.id;
    // Cautam dupa _id
    const cerereaGasita = requests.find(r => r._id === idCautat);

    if (cerereaGasita) {
        res.json(cerereaGasita);
    } else {
        res.status(404).json({ error: "Nu am gasit cererea." });
    }
});


// 2. Ruta care salveaza raspunsul (Accept/Refuz)
// Am decomentat aceasta ruta pentru a putea procesa plata
app.post('/api/respond-request', (req, res) => {
    const { id, requesteeName, status } = req.body;

    const cerere = requests.find(r => r._id === id);

    if (!cerere) {
        return res.status(404).json({ error: "Cererea nu exista!" });
    }

    // Adaugam in istoric
    const newTransaction = {
        requesteeName: requesteeName || "Anonim",
        status: status, // 'ACCEPTED' sau 'REJECTED'
        timestamp: new Date()
    };

    cerere.transactions.push(newTransaction);

    if (status === 'ACCEPTED') {
        cerere.totalCollected += cerere.amount;
    }

    console.log("Tranzactie noua:", newTransaction);
    res.json({ success: true, currentTotal: cerere.totalCollected });
});


//Pornire server
app.listen(port, () => {
    console.log(`Serverlul a pornit pe http://localhost:${port}`);
});