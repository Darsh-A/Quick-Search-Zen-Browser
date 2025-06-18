(function() {
    'use strict';
    
    const injectCSS = () => {
        const css = `
            @keyframes quicksearchSlideIn {
                0% {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                60% {
                    transform: translateY(5%);
                    opacity: 1;
                }
                80% {
                    transform: translateY(-2%);
                }
                100% {
                    transform: translateY(0);
                }
            }
            
            @keyframes quicksearchSlideOut {
                0% {
                    transform: translateY(0);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100%);
                    opacity: 0;
                }
            }
            
            @keyframes quicksearchExpand {
                0% {
                    height: 56px;
                }
                60% {
                    height: 370px;
                }
                80% {
                    height: 330px;
                }
                100% {
                    height: 340px;
                }
            }
            
            @keyframes quicksearchCollapseAndSlideOut {
                0% {
                    transform: translateY(0);
                    height: 340px;
                    opacity: 1;
                }
                30% {
                    height: 56px;
                    transform: translateY(0);
                    opacity: 0.9;
                }
                100% {
                    height: 56px;
                    transform: translateY(-100%);
                    opacity: 0;
                }
            }
            
            #quicksearch-container {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 550px;
                height: 56px;
                background-color: #1e1f1f;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                display: none;
                flex-direction: column;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                opacity: 0;
                border: 1px solid #e0e0e0;
                transition: height 0.3s ease;
            }
            
            #quicksearch-container.visible {
                display: flex;
                opacity: 1;
                animation: quicksearchSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            
            #quicksearch-container.closing {
                animation: quicksearchSlideOut 0.3s ease-in forwards;
            }
            
            #quicksearch-container.expanded.closing {
                animation: quicksearchCollapseAndSlideOut 0.5s ease-in forwards;
            }
            
            #quicksearch-container.expanded {
                animation: quicksearchExpand 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                height: 340px;
            }
            
            #quicksearch-searchbar-container {
                display: flex;
                padding: 10px;
                background-color: #2a2a2a;
                border-bottom: 1px solid #444;
                align-items: center;
                min-height: 56px;
                box-sizing: border-box;
            }
            
            #quicksearch-searchbar {
                flex: 1;
                height: 36px;
                border-radius: 18px;
                border: none;
                padding: 0 15px;
                font-size: 14px;
                background-color: #3a3a3a;
                color: #f0f0f0;
                outline: none;
                transition: background-color 0.2s;
            }
            
            #quicksearch-searchbar:focus {
                background-color: #444;
                box-shadow: 0 0 0 2px rgba(255,255,255,0.1);
            }
            
            #quicksearch-browser-container {
                flex: 1;
                width: 100%;
                border: none;
                background-color: #1e1f1f;
                position: relative;
                overflow: hidden;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            #quicksearch-container.expanded #quicksearch-browser-container {
                opacity: 1;
            }
            
            #quicksearch-content-frame {
                width: 100%;
                height: 100%;
                border: none;
                overflow: hidden;
                background-color: #1e1f1f;
                transform-origin: 0 0;
                transform: scale(1);
            }
            
            .quicksearch-close-button {
                width: 24px;
                height: 24px;
                background-color: rgba(240, 240, 240, 0.8);
                border: none;
                border-radius: 50%;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #555;
                cursor: pointer;
                margin-left: 8px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                transition: background-color 0.2s, transform 0.2s;
            }
            
            .quicksearch-close-button:hover {
                background-color: rgba(220, 220, 220, 0.9);
                transform: scale(1.1);
                color: #000;
            }
            
            .quicksearch-engine-indicator {
                display: flex;
                align-items: center;
                padding: 0 8px;
                font-size: 12px;
                color: #aaa;
            }
            .z-index: 10000;
        `;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'quicksearch-styles';
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
    };

    function ensureServicesAvailable() {
        if (typeof Services === 'undefined' && typeof Components !== 'undefined') {
            try {
                Components.utils.import("resource://gre/modules/Services.jsm");
                return true;
            } catch (e) {
                return false;
            }
        }
        return typeof Services !== 'undefined';
    }

    function loadContentInBrowser(browser, searchUrl) {
        try {
            try {
                const uri = Services.io.newURI(searchUrl);
                const principal = Services.scriptSecurityManager.getSystemPrincipal();
                browser.loadURI(uri, {triggeringPrincipal: principal});
            } catch (e) {
                browser.loadURI(searchUrl);
            }
            return true;
        } catch (e) {
            try {
                browser.setAttribute("src", searchUrl);
                return true;
            } catch (e) {
                return false;
            }
        }
    }

    function adjustContentScaling(element) {
        if (!element) return;
        
        element.addEventListener('load', function() {
            const scaleFactor = 0.95;
            element.style.transform = `scale(${scaleFactor})`;
            element.style.transformOrigin = '0 0';
            
            if (element.tagName.toLowerCase() === 'iframe') {
                setTimeout(() => {
                    try {
                        if (element.contentDocument) {
                            const style = element.contentDocument.createElement('style');
                            style.textContent = `
                                body, html {
                                    overflow: hidden !important;
                                    height: 100% !important;
                                    width: 100% !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                }
                                
                                * {
                                    scrollbar-width: none !important;
                                }
                                *::-webkit-scrollbar {
                                    display: none !important;
                                    width: 0 !important;
                                    height: 0 !important;
                                }
                                
                                body {
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                    background-color: #1e1f1f !important;
                                    display: block !important;
                                }
                                
                                body > * {
                                    z-index: auto !important;
                                    position: relative !important;
                                }
                            `;
                            element.contentDocument.head.appendChild(style);
                            
                            const mainContent = element.contentDocument.body;
                            if (mainContent) {
                                mainContent.style.transformOrigin = '0 0';
                            }
                        }
                    } catch (e) {
                        // Cross-origin restrictions might prevent this
                    }
                }, 500);
            }
        });
    }

    function init() {
        injectCSS();
        attachGlobalHotkey();

    }
    
    function attachGlobalHotkey() {
        window.addEventListener("keydown", function(event) {
            if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                
                showQuickSearchContainer();
                
                return false;
            }
        }, true);
    }
    
    function showQuickSearchContainer() {
        const container = createSearchContainer();
        container.classList.add('visible');
        container.classList.remove('expanded');
        
        const searchBar = document.getElementById('quicksearch-searchbar');
        if (searchBar) {
            setTimeout(() => {
                searchBar.focus();
            }, 100);
        }
        
        addEscKeyListener(container);
    }

    function handleQuickSearch(query) {
        ensureServicesAvailable();

        getSearchURLFromInput(query).then(searchUrl => {
            try {
                const container = document.getElementById('quicksearch-container');
                const browserContainer = document.getElementById('quicksearch-browser-container');

                container.classList.add('expanded');

                const engineIndicator = document.getElementById('quicksearch-engine-indicator');
                if (engineIndicator) {
                    Services.search.getEngines().then(engines => {
                        let [prefix, ..._] = query.trim().split(/\s+/);
                        let engine = engines.find(e =>
                            e._definedAliases && e._definedAliases.includes(prefix)
                        );

                        if (!engine) {
                            engine = Services.search.defaultEngine;
                        }
                        engineIndicator.textContent = engine.name;
                    });
                }
                
                while (browserContainer.firstChild) {
                    browserContainer.removeChild(browserContainer.firstChild);
                }
                
                const browserElement = createBrowserElement();
                
                if (browserElement) {
                    browserElement.id = 'quicksearch-content-frame';
                    browserElement.style.width = '100%';
                    browserElement.style.height = '100%';
                    browserElement.style.border = 'none';
                    browserElement.style.background = '#1e1f1f';
                    browserElement.style.overflow = 'hidden';
                    
                    browserContainer.appendChild(browserElement);
                    
                    const success = loadContentInBrowser(browserElement, searchUrl);
                    
                    if (success) {
                        adjustContentScaling(browserElement);
                        return;
                    } else {
                        browserContainer.removeChild(browserElement);
                    }
                }
                
                const iframe = document.createElement('iframe');                
                iframe.id = 'quicksearch-content-frame';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.style.background = '#1e1f1f';
                iframe.style.overflow = 'hidden';
                
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation');
                iframe.setAttribute('scrolling', 'no');
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.referrerPolicy = 'origin';
                
                iframe.addEventListener('load', function() {
                    setTimeout(() => {
                        const containerWidth = browserContainer.clientWidth;
                        const containerHeight = browserContainer.clientHeight;
                        
                        const scaleFactor = 0.95;
                        iframe.style.width = `${Math.floor(containerWidth / scaleFactor)}px`;
                        iframe.style.height = `${Math.floor(containerHeight / scaleFactor)}px`;
                    }, 500);
                });
                
                browserContainer.appendChild(iframe);
                
                setTimeout(() => {
                    iframe.src = searchUrl;
                }, 100);

                adjustContentScaling(iframe);
                
            } catch (error) {
                try {
                    gBrowser.addTab(searchUrl, {
                        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                    });
                } catch (e) {
                    window.open(searchUrl, '_blank');
                }
            }
        });
    }

    function addEscKeyListener(container) {
        if (container._escKeyListener) {
            document.removeEventListener('keydown', container._escKeyListener);
        }
        
        container._escKeyListener = function(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                closeQuickSearch(container);
            }
        };
        
        document.addEventListener('keydown', container._escKeyListener);
    }

    function closeQuickSearch(container) {
        if (!container) container = document.getElementById('quicksearch-container');
        if (!container) return;
        
        // Add closing class but don't remove expanded yet
        container.classList.add('closing');
        
        // Determine animation duration based on whether it's expanded
        const animationDuration = container.classList.contains('expanded') ? 500 : 300;
        
        setTimeout(() => {
            container.classList.remove('visible');
            container.classList.remove('closing');
            container.classList.remove('expanded');
            
            const iframe = document.getElementById('quicksearch-content-frame');
            if (iframe) {
                try {
                    iframe.src = 'about:blank';
                } catch (err) {
                    // Ignore errors
                }
            }
            
            if (container._escKeyListener) {
                document.removeEventListener('keydown', container._escKeyListener);
                container._escKeyListener = null;
            }
        }, animationDuration);
    }

    function createSearchContainer() {
        if (document.getElementById('quicksearch-container')) {
            return document.getElementById('quicksearch-container');
        }
        
        const container = document.createElement('div');
        container.id = 'quicksearch-container';
        
        const searchBarContainer = document.createElement('div');
        searchBarContainer.id = 'quicksearch-searchbar-container';
        
        const searchBar = document.createElement('input');
        searchBar.id = 'quicksearch-searchbar';
        searchBar.type = 'text';
        searchBar.placeholder = 'Search';
        searchBar.autocomplete = 'off';
        
        try {
            if (window.UrlbarProvider && window.UrlbarProviderQuickSuggest) {
                searchBar.setAttribute('data-urlbar', 'true');
            }
        } catch (e) {
        }
        
        const engineIndicator = document.createElement('div');
        engineIndicator.id = 'quicksearch-engine-indicator';
        engineIndicator.className = 'quicksearch-engine-indicator';
        engineIndicator.textContent = 'Google';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'quicksearch-close-button';
        closeButton.innerHTML = '&#10005;';
        closeButton.title = 'Close';
        closeButton.onclick = (e) => {
            e.stopPropagation();
            closeQuickSearch(container);
        };
        
        searchBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || (e.ctrlKey && e.key === "Enter")) {
                e.preventDefault();
                handleQuickSearch(searchBar.value);
            }
        });
        
        searchBarContainer.appendChild(searchBar);
        searchBarContainer.appendChild(engineIndicator);
        searchBarContainer.appendChild(closeButton);
        
        const browserContainer = document.createElement('div');
        browserContainer.id = 'quicksearch-browser-container';
        browserContainer.style.flex = '1';
        browserContainer.style.width = '100%';
        browserContainer.style.position = 'relative';
        browserContainer.style.overflow = 'hidden';
        
        container.appendChild(searchBarContainer);
        container.appendChild(browserContainer);
        
        document.body.appendChild(container);
        
        return container;
    }

    function createBrowserElement() {
        try {
            const browser = document.createXULElement("browser");
            
            browser.setAttribute("type", "content");
            browser.setAttribute("remote", "true");
            browser.setAttribute("maychangeremoteness", "true");
            browser.setAttribute("disablehistory", "true");
            browser.setAttribute("flex", "1");
            browser.setAttribute("noautohide", "true");
            
            return browser;
        } catch (e) {
            try {
                const browser = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "browser");
                
                browser.setAttribute("type", "content");
                browser.setAttribute("remote", "true");
                
                return browser;
            } catch (e) {
                return null;
            }
        }
    }

    function getSearchURLFromInput(input) {
        return Services.search.getEngines().then(engines => {
            let [prefix, ...rest] = input.trim().split(/\s+/);
            let searchTerm = rest.join(" ");

            // Try to match engine by alias (e.g., "@ddg")
            let engine = engines.find(e =>
                e._definedAliases && e._definedAliases.includes(prefix)
            );

            // If no alias matched, fallback to default engine
            if (!engine) {
                engine = Services.search.defaultEngine;
                searchTerm = input; // Whole input is the term
            }

            let submission = engine.getSubmission(searchTerm);
            return submission.uri.spec;
        });
    }
    setTimeout(init, 1000);
})();
