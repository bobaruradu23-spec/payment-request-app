     // 1. Luam ID-ul din URL (care arata gen .../pay/173456789)
        const currentLink = window.location.pathname; 
        const idCerere = currentLink.split('/').pop(); 

        // 2. Cand se incarca pagina, cerem detalii de la server
        async function incarcaDetalii() {
            try {
                const response = await fetch(`/api/get-request/${idCerere}`);
                
                if (!response.ok) {
                    document.getElementById('loading').innerText = "Cererea nu a fost găsită sau a expirat.";
                    return;
                }

                const data = await response.json();

                // Punem datele in HTML
                document.getElementById('creator-name').innerText = data.createdBy;
                document.getElementById('amount-display').innerText = data.amount;
                document.getElementById('currency-display').innerText = data.currency;
                document.getElementById('reason-display').innerText = data.reason;
                document.getElementById('date-display').innerText = new Date(data.createdAt).toLocaleString('ro-RO');

                // Ascundem loader-ul si aratam continutul
                document.getElementById('loading').style.display = 'none';
                document.getElementById('content').style.display = 'block';

            } catch (err) {
                console.error(err);
                document.getElementById('loading').innerText = "Eroare de conexiune.";
            }
        }

        // 3. Functia care trimite raspunsul (Platit sau Refuzat)
        async function raspunde(status) {
            const numePlatitor = document.getElementById('payer-name').value;

            try {
                const response = await fetch('/api/respond-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: idCerere,
                        requesteeName: numePlatitor, // Cine plateste
                        status: status
                    })
                });

                const result = await response.json();

                if (result.success) {
                    const msgDiv = document.getElementById('status-msg');
                    document.getElementById('content').style.display = 'none'; // Ascundem butoanele
                    
                    if (status === 'ACCEPTED') {
                        msgDiv.style.color = '#27ae60';
                        msgDiv.innerText = "✅ Plată înregistrată cu succes!";
                    } else {
                        msgDiv.style.color = '#e74c3c';
                        msgDiv.innerText = "❌ Cerere refuzată.";
                    }
                }

            } catch (err) {
                alert("Eroare la trimiterea răspunsului.");
            }
        }

        // Pornim functia la incarcare
        incarcaDetalii();