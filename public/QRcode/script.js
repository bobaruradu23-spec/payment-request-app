let currentRequestId = null;
let pollInterval = null;

async function creeazaLink() {
    const amount = document.getElementById('amount').value;
    const reason = document.getElementById('reason').value;
    const currency = document.getElementById('currency').value;

    if (!amount || !reason) {
        alert("Te rog completează suma și motivul!");
        return;
    }

    try {
        // 1. Trimitem cererea la server
        const response = await fetch('/api/create-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount: amount, 
                reason: reason,
                currency: currency,
                creator: 'Eu' // Aici am putea pune userul logat
            })
        });

        const data = await response.json();

        if (data.success) {
            // 2. Afisam QR-ul
            document.getElementById('result').style.display = 'block';
            document.getElementById('qr-image').src = data.qrCode;
            document.getElementById('payment-link').href = data.link;
            document.getElementById('payment-link').innerText = data.link;

            // 3. Afisam Dashboard-ul de jos
            document.getElementById('live-dashboard').style.display = 'block';
            document.getElementById('display-currency').innerText = currency;
            
            // Salvam ID-ul curent
            currentRequestId = data.id;

            // 4. PORNIM UPDATE-UL LIVE (O data la 2 secunde)
            if (pollInterval) clearInterval(pollInterval); // curatam daca exista deja unul
            pollInterval = setInterval(verificaStatus, 2000); 
        }

    } catch (err) {
        console.error(err);
        alert("Eroare la generare!");
    }
}

// Functia care intreaba serverul: "S-a mai platit ceva?"
async function verificaStatus() {
    if (!currentRequestId) return;

    try {
        const response = await fetch(`/api/get-request/${currentRequestId}`);
        const data = await response.json();

        if (data) {
            // Actualizam suma totala
            document.getElementById('total-amount').innerText = data.totalCollected;

            // Actualizam lista de oameni
            const listaDiv = document.getElementById('transactions-list');
            
            if (data.transactions.length === 0) {
                listaDiv.innerHTML = '<p style="color: #999;">Aștept plăți...</p>';
            } else {
                listaDiv.innerHTML = ''; // Golim lista veche
                
                // Adaugam fiecare tranzactie noua
                data.transactions.forEach(t => {
                    const culoare = t.status === 'ACCEPTED' ? 'green' : 'red';
                    const icon = t.status === 'ACCEPTED' ? '💰' : '❌';
                    
                    const p = document.createElement('p');
                    p.innerHTML = `${icon} <strong>${t.requesteeName}</strong>: <span style="color:${culoare}">${t.status}</span>`;
                    p.style.borderBottom = "1px solid #eee";
                    p.style.padding = "5px 0";
                    listaDiv.appendChild(p);
                });
            }
        }
    } catch (err) {
        console.log("Eroare la verificare status:", err);
    }
}