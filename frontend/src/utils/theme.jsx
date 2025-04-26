export const toggleDarkMode = (shouldBeDark) => {
    const isDark = shouldBeDark ?? localStorage.getItem('theme') !== 'dark';
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
  };
  
  export const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      return true;
    }
    return false;
  };