(()=>{let choice;try{choice=localStorage.getItem('perschall-theme')}catch{}document.documentElement.dataset.theme=choice|| (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');})();

