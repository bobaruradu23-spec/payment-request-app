
// Dacă utilizatorul e deja logat nu are ce cauta aici
if (localStorage.getItem('userCurent')) {
    window.location.href = '/';
}

function login() {
    //ce avem in input
    const nume = document.getElementById('usernameInput').value;
    
    // Verificăm să nu fie gol sau doar spații goale
    if(nume.trim() === "") {
        alert("Introdu numele de utilizator!");
        return;
    }

    // Salvam numele in mem browserului
    localStorage.setItem('userCurent', nume);

    //Îl trimitem la pagina principală 
    window.location.href = '/';
}