function renderNavigation() {
    const navContainer = document.getElementById('nav-container');
    if (!navContainer) return;

    const userInfo = getUserInfo();
    
    navContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px;">
            <div>
                <a href="index.html" style="margin-right: 15px; color: #007bff; text-decoration: none;">Home</a>
                <a href="case.html" style="color: #007bff; text-decoration: none;">Phone Cases</a>
            </div>
            <div>
                ${userInfo ? `
                    <span style="margin-right: 15px;">Hello, ${userInfo.displayName}</span>
                    <button onclick="signout()" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">Sign Out</button>
                ` : `
                    <button onclick="signin()" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">Sign In</button>
                `}
            </div>
        </div>
    `;
}
