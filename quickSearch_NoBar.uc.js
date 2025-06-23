(function() {
    'use strict';

    // --- Preference Configuration (following AI Tab Groups pattern) ---
    
    // Preference Keys
    const CONTEXT_MENU_ENABLED_PREF = "extensions.quicksearch.context_menu.enabled";
    const CONTEXT_MENU_ENGINE_PREF = "extensions.quicksearch.context_menu.engine";
    const CONTEXT_MENU_ACCESS_KEY_PREF = "extensions.quicksearch.context_menu.access_key";
    const CONTAINER_POSITION_PREF = "extensions.quicksearch.container.position";
    const CONTAINER_THEME_PREF = "extensions.quicksearch.container.theme";
    const CONTAINER_WIDTH_PREF = "extensions.quicksearch.container.width";
    const CONTAINER_HEIGHT_PREF = "extensions.quicksearch.container.height";
    const BEHAVIOR_ANIMATION_ENABLED_PREF = "extensions.quicksearch.behavior.animation_enabled";
    const BEHAVIOR_REMEMBER_SIZE_PREF = "extensions.quicksearch.behavior.remember_size";
    const BEHAVIOR_AUTO_FOCUS_PREF = "extensions.quicksearch.behavior.auto_focus";
    const SHORTCUTS_TOGGLE_KEY_PREF = "extensions.quicksearch.shortcuts.toggle_key";
    const SHORTCUTS_ESCAPE_CLOSES_PREF = "extensions.quicksearch.shortcuts.escape_closes";

    // Helper function to read preferences with fallbacks (like AI Tab Groups)
    const getPref = (prefName, defaultValue = "") => {
        try {
            const prefService = Services.prefs;
            if (prefService.prefHasUserValue(prefName)) {
                switch (prefService.getPrefType(prefName)) {
                    case prefService.PREF_STRING:
                        return prefService.getStringPref(prefName);
                    case prefService.PREF_INT:
                        return prefService.getIntPref(prefName);
                    case prefService.PREF_BOOL:
                        return prefService.getBoolPref(prefName);
                }
            }
        } catch (e) {
            console.warn(`QuickSearch NoBar: Failed to read preference ${prefName}:`, e);
        }
        return defaultValue;
    };

    // Helper function to set preferences
    const setPref = (prefName, value) => {
        try {
            const prefService = Services.prefs;
            if (typeof value === 'boolean') {
                prefService.setBoolPref(prefName, value);
            } else if (typeof value === 'number') {
                prefService.setIntPref(prefName, value);
            } else {
                prefService.setStringPref(prefName, value);
            }
        } catch (e) {
            console.warn(`QuickSearch NoBar: Failed to set preference ${prefName}:`, e);
        }
    };

    // Read preference values once at startup (like AI Tab Groups)
    const CONTEXT_MENU_ENABLED = getPref(CONTEXT_MENU_ENABLED_PREF, true);
    const CONTEXT_MENU_ENGINE = getPref(CONTEXT_MENU_ENGINE_PREF, "@ddg");
    const CONTEXT_MENU_ACCESS_KEY = getPref(CONTEXT_MENU_ACCESS_KEY_PREF, "Q");
    let CONTAINER_POSITION = getPref(CONTAINER_POSITION_PREF, "top-right");
    const CONTAINER_THEME = getPref(CONTAINER_THEME_PREF, "dark");
    const CONTAINER_WIDTH = getPref(CONTAINER_WIDTH_PREF, 550);
    const CONTAINER_HEIGHT = getPref(CONTAINER_HEIGHT_PREF, 300);
    const BEHAVIOR_ANIMATION_ENABLED = getPref(BEHAVIOR_ANIMATION_ENABLED_PREF, true);
    const BEHAVIOR_REMEMBER_SIZE = getPref(BEHAVIOR_REMEMBER_SIZE_PREF, true);
    const BEHAVIOR_AUTO_FOCUS = getPref(BEHAVIOR_AUTO_FOCUS_PREF, true);
    const SHORTCUTS_TOGGLE_KEY = getPref(SHORTCUTS_TOGGLE_KEY_PREF, "Ctrl+Shift+Q");
    const SHORTCUTS_ESCAPE_CLOSES = getPref(SHORTCUTS_ESCAPE_CLOSES_PREF, true);

    // --- End Preference Configuration ---
    
    const googleFaviconAPI = (url) => {
        try {
            const hostName = new URL(url).hostname;
            return `https://s2.googleusercontent.com/s2/favicons?domain_url=https://${hostName}&sz=32`;
        } catch (e) {
            return undefined; // Return undefined for invalid URLs
        }
    };

    const getFaviconImg  =(engine)=>{ 
      const img = document.createElement('img');
      const thirdFallback = 'chrome://branding/content/icon32.png'
      engine.getIconURL().then(url=>{
        img.src = url || googleFaviconAPI(engine.getSubmission("test").uri.spec) || thirdFallback
      }).catch( 
        // fallback to google faviconAPI in case of error
        img.src = googleFaviconAPI(engine.getSubmission("test").uri.spec) || thirdFallback 
      )
      img.src ='chrome://browser/content/zen-images/grain-bg.png'
      img.alt = engine.name;
      return img
    }

    let currentSearchEngine = null;
    let currentSearchTerm = '';
    const updateSelectedEngine = () =>{
      if (!currentSearchEngine) return
      const img = getFaviconImg(currentSearchEngine)
      const quicksearchEngineButton = document.getElementById( 'quicksearch-engine-select' );
      if (quicksearchEngineButton){
        quicksearchEngineButton.innerHTML = '';
        quicksearchEngineButton.appendChild(img);
        quicksearchEngineButton.appendChild(document.createTextNode(currentSearchEngine.name));
      }
    }

    // Global definition for resizer styles to be used dynamically
    const resize_handle_styles = {
        'top-left': { top: 'auto', left: 'auto', right: '0', bottom: '0', transform: 'rotate(90deg)', cursor: 'se-resize' },
        'center': { top: 'auto', left: 'auto', right: '0', bottom: '0', transform: 'rotate(90deg)', cursor: 'se-resize' },
        'top-right': { top: 'auto', right: 'auto', left: '0', bottom: '0', transform: 'rotate(180deg)', cursor: 'sw-resize' },
        'bottom-left': { bottom: 'auto', left: 'auto', top: '0', right: '0', transform: 'rotate(0deg)', cursor: 'ne-resize' },
        'bottom-right': { bottom: 'auto', right: 'auto', top: '0', left: '0', transform: 'rotate(270deg)', cursor: 'nw-resize' },
    };

    const injectCSS = (theme = 'dark', position = 'top-right', animationsEnabled = true) => {
        // Theme configurations
        const themes = {
            dark: {
                containerBg: '#1e1f1f',
                containerBorder: '#404040',
                searchBarBg: '#2a2a2a',
                searchBarInputBg: '#3a3a3a',
                searchBarInputFocusBg: '#444',
                searchBarBorder: '#444',
                textColor: '#f0f0f0',
                closeBtnBg: 'rgba(240, 240, 240, 0.8)',
                closeBtnColor: '#555',
                closeBtnHoverBg: 'rgba(220, 220, 220, 0.9)',
                closeBtnHoverColor: '#000'
            },
            light: {
                containerBg: '#ffffff',
                containerBorder: '#e0e0e0',
                searchBarBg: '#f9f9f9',
                searchBarInputBg: '#ffffff',
                searchBarInputFocusBg: '#f0f0f0',
                searchBarBorder: '#ddd',
                textColor: '#333',
                closeBtnBg: 'rgba(60, 60, 60, 0.8)',
                closeBtnColor: '#fff',
                closeBtnHoverBg: 'rgba(40, 40, 40, 0.9)',
                closeBtnHoverColor: '#fff'
            },
            auto: window.matchMedia('(prefers-color-scheme: dark)').matches ? {
                containerBg: '#1e1f1f',
                containerBorder: '#404040',
                searchBarBg: '#2a2a2a',
                searchBarInputBg: '#3a3a3a',
                searchBarInputFocusBg: '#444',
                searchBarBorder: '#444',
                textColor: '#f0f0f0',
                closeBtnBg: 'rgba(240, 240, 240, 0.8)',
                closeBtnColor: '#555',
                closeBtnHoverBg: 'rgba(220, 220, 220, 0.9)',
                closeBtnHoverColor: '#000'
            } : {
                containerBg: '#ffffff',
                containerBorder: '#e0e0e0',
                searchBarBg: '#f9f9f9',
                searchBarInputBg: '#ffffff',
                searchBarInputFocusBg: '#f0f0f0',
                searchBarBorder: '#ddd',
                textColor: '#333',
                closeBtnBg: 'rgba(60, 60, 60, 0.8)',
                closeBtnColor: '#fff',
                closeBtnHoverBg: 'rgba(40, 40, 40, 0.9)',
                closeBtnHoverColor: '#fff'
            }
        };

        const currentTheme = themes[theme] || themes.dark;

        const css = `
            @keyframes quicksearchSlideIn {
                0% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(0.8)' : 'translateY(-100%)'};
                    opacity: 0;
                }
                60% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(1.05)' : 'translateY(5%)'};
                    opacity: 1;
                }
                80% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(0.98)' : 'translateY(-2%)'};
                }
                100% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(1)' : 'translateY(0)'};
                }
            }
            
            @keyframes quicksearchSlideOut {
                0% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(1)' : 'translateY(0)'};
                    opacity: 1;
                }
                100% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(0.8)' : 'translateY(-100%)'};
                    opacity: 0;
                }
            }
            
            #quicksearch-container {
                position: fixed;
                width: 550px;
                min-width: 200px;
                min-height: 150px;
                max-width: 70vw;
                max-height: 70vh;
                background-color: ${currentTheme.containerBg};
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                display: none;
                flex-direction: column;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                opacity: 0;
                border: 1px solid ${currentTheme.containerBorder};
            }
            
            #quicksearch-container.visible {
                display: flex;
                opacity: 1;
                ${animationsEnabled ? 'animation: quicksearchSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;' : ''}
            }
            
            #quicksearch-container.closing {
                ${animationsEnabled ? 'animation: quicksearchSlideOut 0.3s ease-in forwards;' : ''}
            }
            
            #quicksearch-searchbar-container {
                display: flex;
                padding: 10px;
                background-color: ${currentTheme.searchBarBg};
                border-bottom: 1px solid ${currentTheme.searchBarBorder};
                align-items: center;
                min-height: 56px;
                box-sizing: border-box;
                cursor: grab;
            }
            
            #quicksearch-searchbar {
                flex: 1;
                height: 36px;
                border-radius: 18px;
                border: none;
                padding: 0 15px;
                font-size: 14px;
                background-color: ${currentTheme.searchBarInputBg};
                color: ${currentTheme.textColor};
                outline: none;
                transition: background-color 0.2s;
            }
            
            #quicksearch-searchbar:focus {
                background-color: ${currentTheme.searchBarInputFocusBg};
                box-shadow: 0 0 0 2px rgba(255,255,255,0.1);
            }
            
            #quicksearch-browser-container {
                flex: 1;
                width: 100%;
                border: none;
                background-color: ${currentTheme.containerBg};
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
                background-color: ${currentTheme.containerBg};
                transform-origin: 0 0;
                transform: scale(1);
            }
            
            .quicksearch-close-button {
                width: 24px;
                height: 24px;
                background-color: ${currentTheme.closeBtnBg};
                border: none;
                border-radius: 50%;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${currentTheme.closeBtnColor};
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                transition: background-color 0.2s, transform 0.2s;
            }
            
            .quicksearch-close-button:hover {
                background-color: ${currentTheme.closeBtnHoverBg};
                transform: scale(1.1);
                color: ${currentTheme.closeBtnHoverColor};
            }
            
            #quicksearch-resizer {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 0;
                height: 0;
                background:transparent;
                border-style: solid;
                border-width: 0 16px 16px 0;
                border-color: transparent #fff transparent transparent;
                z-index: 10001;
            }

            #quicksearch-engine-select-wrapper {
              position: relative;
              display: inline-block;
              min-width: 150px;
              font-size: 14px;
            }

            #quicksearch-engine-select {
              flex: 1;
              height: 36px;
              border-radius: 18px;
              border: none;
              padding: 0 15px;
              margin: 0 15px;
              font-size: 14px;
              background-color: ${currentTheme.searchBarInputBg};
              color: ${currentTheme.textColor};
              outline: none;
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
              transition: background-color 0.2s;
            }

            #quicksearch-engine-options {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background-color: #1e1f1f;
              border-radius: 5px;
              max-height: 200px;
              overflow-y: auto;
              z-index: 1000;
              display: none;
            }

            #quicksearch-engine-option {
              padding: 6px 10px;
              display: flex;
              align-items: center;
              cursor: pointer;
              gap: 8px;
            }

            #quicksearch-engine-option:hover {
              background-color: #333;
            }

            #quicksearch-engine-options img,
            #quicksearch-engine-select-wrapper img {
              width: 16px;
              height: 16px;
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

    function styleContentFrame(element) {
        if (!element) return;
        
        if (element.tagName.toLowerCase() === 'iframe') {
            element.addEventListener('load', function() {
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
                        }
                    } catch (e) {
                        // Cross-origin restrictions might prevent this
                    }
                }, 500);
            });
        }
    }

    function init() {
        if (!ensureServicesAvailable()) return;
        
        // Inject CSS with user preferences
        injectCSS(CONTAINER_THEME, CONTAINER_POSITION, BEHAVIOR_ANIMATION_ENABLED);
        attachGlobalHotkey();
        loadContainerDimensions();
        
        // Add context menu item if enabled
        if (CONTEXT_MENU_ENABLED) {
            addContextMenuItem();
        }
    }
    
    function attachGlobalHotkey() {
        window.addEventListener("keydown", function(event) {
            // Check for Ctrl+Enter (original hotkey)
            if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                
                showQuickSearchContainer();
                
                return false;
            }
            
            // Check for custom toggle key
            const toggleKey = SHORTCUTS_TOGGLE_KEY;
            const keyParts = toggleKey.split('+').map(k => k.trim());
            const hasCtrl = keyParts.includes('Ctrl');
            const hasShift = keyParts.includes('Shift');
            const hasAlt = keyParts.includes('Alt');
            const mainKey = keyParts[keyParts.length - 1];
            
            if (event.ctrlKey === hasCtrl && 
                event.shiftKey === hasShift && 
                event.altKey === hasAlt && 
                event.key.toLowerCase() === mainKey.toLowerCase()) {
                
                event.preventDefault();
                event.stopPropagation();
                
                // Toggle Quick Search
                const existingContainer = document.getElementById('quicksearch-container');
                if (existingContainer && existingContainer.classList.contains('visible')) {
                    closeQuickSearch(existingContainer);
                } else {
                    showQuickSearchContainer();
                }
                
                return false;
            }
        }, true);
    }
    
    function showQuickSearchContainer() {
        const container = createSearchContainer();
        container.classList.add('visible');
        
        const searchBar = document.getElementById('quicksearch-searchbar');
        if (searchBar && BEHAVIOR_AUTO_FOCUS) {
            setTimeout(() => {
                searchBar.focus();
            }, 100);
        }
        
        addEscKeyListener(container);
    }

    function handleQuickSearch(query, engineName = null) {
        ensureServicesAvailable();

        const searchPromise = engineName ? 
            getSearchURLWithEngine(query, engineName) : 
            getSearchURLFromInput(query);

        searchPromise.then(searchUrl => {
            try {
                const container = document.getElementById('quicksearch-container');
                const browserContainer = document.getElementById('quicksearch-browser-container');

                container.classList.add('expanded');
                
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
                        styleContentFrame(browserElement);
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
                
                // Remove the load event listener that adjusted dimensions
                
                browserContainer.appendChild(iframe);
                
                setTimeout(() => {
                    iframe.src = searchUrl;
                }, 100);

                styleContentFrame(iframe);
                
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
                const escapeCloses = SHORTCUTS_ESCAPE_CLOSES;
                if (escapeCloses) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeQuickSearch(container);
                    document.removeEventListener('keydown', container._escKeyListener);
                }
            }
        };
        
        document.addEventListener('keydown', container._escKeyListener);
    }

    function closeQuickSearch(container) {
        if (!container) container = document.getElementById('quicksearch-container');
        if (!container) return;
        
        const animationsEnabled = BEHAVIOR_ANIMATION_ENABLED;
        
        if (animationsEnabled) {
            container.classList.add('closing');
        }
        
        // Determine animation duration based on preferences and whether it's expanded
        const animationDuration = animationsEnabled ? 
            (container.classList.contains('expanded') ? 500 : 300) : 0;
        
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

    function saveContainerDimensions(width, height) {
        if (BEHAVIOR_REMEMBER_SIZE) {
            setPref(CONTAINER_WIDTH_PREF, width)
            setPref(CONTAINER_HEIGHT_PREF, height)
        }
    }

    function loadContainerDimensions() {
        const container = document.getElementById('quicksearch-container');
        const width  = CONTAINER_WIDTH 
        const height = CONTAINER_HEIGHT
        if (container) {
            container.style.width = `${width}px`;
            container.style.height = `${height}px`;
        }
    }

    // Helper to apply position styles to container and resizer
     function applyContainerPosition(positionName) {
        let container = document.getElementById('quicksearch-container');
        const resizer = document.getElementById('quicksearch-resizer');
        const positions = {
            'top-right': { top: '10px', right: '10px', left: 'auto', bottom: 'auto' },
            'top-left': { top: '10px', left: '10px', right: 'auto', bottom: 'auto' },
            'bottom-right': { bottom: '10px', right: '10px', top: 'auto', left: 'auto' },
            'bottom-left': { bottom: '10px', left: '10px', top: 'auto', right: 'auto' }
        };

        const targetPosition = positions[positionName] || positions['top-right'];

        if (positionName === 'center') {
            // Calculate center position in pixels
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

            const left = (windowWidth - containerWidth) / 2;
            const top = (windowHeight - containerHeight) / 2;

            container.style.top = `${top}px`;
            container.style.left = `${left}px`;
            container.style.right = 'auto';
            container.style.bottom = 'auto';
        } else {
          for (const property in targetPosition) {
              container.style[property] = targetPosition[property];
          }
        }
        
        // Apply styles to resizer element based on new position
        if (resizer) {
            const resizerStyles = resize_habdle_styles[positionName] || resize_habdle_styles['top-right'];
            for (const property in resizerStyles) {
                 resizer.style[property] = resizerStyles[property];
             }
        }
    }

    // Function to snap container to the closest corner or center
    function snapToClosestCorner() {
        const container = document.getElementById('quicksearch-container');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const currentX = rect.left;
        const currentY = rect.top;
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        const snapPoints = {
            'top-left': { x: 10, y: 10 },
            'top-right': { x: window.innerWidth - containerWidth - 10, y: 10 },
            'center': { x: (window.innerWidth - containerWidth) / 2, y: (window.innerHeight - containerHeight) / 2, transformed: true },
            'bottom-left': { x: 10, y: window.innerHeight - containerHeight - 10 },
            'bottom-right': { x: window.innerWidth - containerWidth - 10, y: window.innerHeight - containerHeight - 10 }
        };

        let closestPointName = '';
        let minDistance = Infinity;

        for (const name in snapPoints) {
            const p = snapPoints[name];
            let targetX = p.x;
            let targetY = p.y;

            // If a transform (like translate(-50%,-50%)) is applied,
            // the CSS `left`/`top` values (targetX, targetY) would result in a *different* effective
            // top-left pixel position. Adjust targetX/Y for distance calculation to reflect this.
            if (p.transformed) { // Only 'center' has this property in our setup
                targetX -= containerWidth / 2;
                targetY -= containerHeight / 2;
            }

            const distance = Math.sqrt(Math.pow(currentX - targetX, 2) + Math.pow(currentY - targetY, 2));

            if (distance < minDistance) {
                minDistance = distance;
                closestPointName = name;
            }
        }
        CONTAINER_POSITION = closestPointName; 
        applyContainerPosition(CONTAINER_POSITION); 
        setPref(CONTAINER_POSITION_PREF, CONTAINER_POSITION); 
    }

    // Create and initialize the search container
    function createSearchContainer() {
        let container = document.getElementById('quicksearch-container');
        
        if (container) {
             // Apply position and resizer styles based on saved preference
             applyContainerPosition(CONTAINER_POSITION);
            return container;
        }
        
        container = document.createElement('div');
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
        
        const quicksearchEngineWrapper = document.createElement('div');
        quicksearchEngineWrapper.id = 'quicksearch-engine-select-wrapper';

        const quicksearchEngineButton = document.createElement('div');
        quicksearchEngineButton.id = 'quicksearch-engine-select';

        const quicksearchOptions = document.createElement('div');
        quicksearchOptions.id = 'quicksearch-engine-options';

        quicksearchEngineWrapper.appendChild(quicksearchEngineButton);
        quicksearchEngineWrapper.appendChild(quicksearchOptions);
        searchBarContainer.appendChild(quicksearchEngineWrapper);

        quicksearchEngineButton.addEventListener('click', (e) => {
          e.stopPropagation();  
          quicksearchOptions.style.display = quicksearchOptions.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
          quicksearchOptions.style.display = 'none';
        });

        Services.search.getEngines().then(engines => {
          engines.forEach(engine => {
            const option = document.createElement('div');
            option.id = 'quicksearch-engine-option';

            const img = getFaviconImg(engine)

            option.appendChild(img);
            option.appendChild(document.createTextNode(engine.name));

            option.addEventListener('click', (e) => {
              e.stopPropagation();
              if (currentSearchEngine && currentSearchEngine.name == engine.name) return;
              currentSearchEngine = engine;
              updateSelectedEngine()
              quicksearchOptions.style.display = 'none';
              if (currentSearchTerm) {
                handleQuickSearch(currentSearchTerm, engine.name);
              }
            });

            quicksearchOptions.appendChild(option);
          });

          return Services.search.getDefault();
        }).then(defaultEngine => {
          currentSearchEngine = defaultEngine;
          const img = getFaviconImg(defaultEngine)

          quicksearchEngineButton.innerHTML = '';
          quicksearchEngineButton.appendChild(img);
          quicksearchEngineButton.appendChild(document.createTextNode(defaultEngine.name));
        });
        
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
        searchBarContainer.appendChild(quicksearchEngineWrapper);
        searchBarContainer.appendChild(closeButton);
        
        const browserContainer = document.createElement('div');
        browserContainer.id = 'quicksearch-browser-container';
        browserContainer.style.flex = '1';
        browserContainer.style.width = '100%';
        browserContainer.style.position = 'relative';
        browserContainer.style.overflow = 'hidden';
        
        // Create resizer element
        const resizer = document.createElement('div');
        resizer.id = 'quicksearch-resizer';
        
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        resizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = container.offsetWidth;
            startHeight = container.offsetHeight;
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
        });
        
        function doResize(e) {
            if (!isResizing) return;
            
            // Adjust for current CONTAINER_POSITION to ensure intuitive resizing
            let width = startWidth;
            let height = startHeight;

            if (CONTAINER_POSITION.includes('right')) {
                width = startWidth + (startX - e.clientX); // Dragging left increases width
            } else { // 'left' or 'center'
                width = startWidth + (e.clientX - startX); // Dragging right increases width
            }

            if (CONTAINER_POSITION.includes('bottom')) {
                height = startHeight + (startY - e.clientY); // Dragging up increases height
            } else { // 'top' or 'center'
                height = startHeight + (e.clientY - startY); // Dragging down increases height
            }
            
            // Enforce minimum dimensions
            width = Math.max(width, 200);
            height = Math.max(height, 150);

            // Enforce maximum dimensions
            width = Math.min(width, window.innerWidth * 0.7);
            height = Math.min(height, window.innerHeight * 0.7);
            
            container.style.width = width + 'px';
            container.style.height = height + 'px';
        }
        
        function stopResize() {
            if (!isResizing) return;
            
            isResizing = false;
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
            
            // Save the new dimensions
            saveContainerDimensions(container.offsetWidth, container.offsetHeight);
            // Snap to corner after resizing to adjust position if it shifted relative to page
            snapToClosestCorner();
        }
        
        container.appendChild(searchBarContainer);
        container.appendChild(browserContainer);
        container.appendChild(resizer);
        
        document.body.appendChild(container);

        // Apply initial position based on preference for container and resizer
        // Calling applyContainerPosition here will get the resizer by its ID
        applyContainerPosition(CONTAINER_POSITION);
        loadContainerDimensions();

        // Drag functionality for header (searchBarContainer)
        let isDragging = false;
        let initialMouseX, initialMouseY;
        let initialContainerX, initialContainerY;

        const doDrag = (e) => {
            if (!isDragging) return;

            let newX = initialContainerX + (e.clientX - initialMouseX);
            let newY = initialContainerY + (e.clientY - initialMouseY);

            // Keep container within viewport boundaries
            const minX = 10;
            const minY = 10;
            const maxX = window.innerWidth - container.offsetWidth - 10;
            const maxY = window.innerHeight - container.offsetHeight - 10;

            newX = Math.max(minX, Math.min(newX, maxX));
            newY = Math.max(minY, Math.min(newY, maxY));

            container.style.left = `${newX}px`;
            container.style.top = `${newY}px`;
            e.preventDefault(); // Prevent text selection during drag
        };

        const stopDrag = () => {
            if (!isDragging) return;

            isDragging = false;
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            searchBarContainer.style.cursor = 'grab'; // Reset cursor

            snapToClosestCorner();
        };

        searchBarContainer.addEventListener('mousedown', function(e) {
            // Only drag with left mouse button
            if (e.button !== 0) return; 

            isDragging = true;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;
            
            const rect = container.getBoundingClientRect();
            initialContainerX = rect.left; // This is the computed pixel value
            initialContainerY = rect.top; // This is the computed pixel value

            // Set position to current pixel values to prevent jump when transform is removed
            container.style.left = `${initialContainerX}px`;
            container.style.top = `${initialContainerY}px`;

            searchBarContainer.style.cursor = 'grabbing';
            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);

            e.preventDefault();
        });
        
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

            // If no alias matched, fallback to selected engine
            if (!engine) {
                engine = currentSearchEngine || Services.search.defaultEngine;
                searchTerm = input; // Whole input is the term
            }else{
                currentSearchEngine = engine
            }

            currentSearchTerm = searchTerm
            let submission = engine.getSubmission(searchTerm);
            return submission.uri.spec;
        });
    }

    // Function to get search URL with a specific engine
    async function getSearchURLWithEngine(query, engineName) {
        let engines = await Services.search.getEngines();
        let engine = engines.find(e => e.name === engineName || (e._definedAliases && e._definedAliases.includes(engineName)));
        if (!engine) engine = await Services.search.getDefault();
        let searchTerm = query.trim();
        currentSearchEngine = engine

        // Small delay before updating selected engine
        setTimeout(() => {
          updateSelectedEngine()
        }, 100);

        currentSearchTerm = searchTerm
        let submission = engine.getSubmission(searchTerm);
        return submission.uri.spec;
    }

    // Function to add context menu item
    function addContextMenuItem() {
        const contextMenu = document.getElementById("contentAreaContextMenu");
        if (!contextMenu) {
            setTimeout(addContextMenuItem, 500);
            return;
        }

        if (document.getElementById("quicksearch-context-menuitem")) {
            return;
        }

        const menuItem = document.createXULElement("menuitem");
        menuItem.id = "quicksearch-context-menuitem";
        menuItem.setAttribute("label", "Open in Quick Search");
        menuItem.setAttribute("accesskey", CONTEXT_MENU_ACCESS_KEY);
        
        menuItem.addEventListener("command", handleContextMenuClick);
        
        const searchSelectItem = contextMenu.querySelector("#context-searchselect");
        
        if (searchSelectItem) {
            // Insert right after the searchselect item
            if (searchSelectItem.nextSibling) {
                contextMenu.insertBefore(menuItem, searchSelectItem.nextSibling);
            } else {
                contextMenu.appendChild(menuItem);
            }
        } else {
            // Fallback: insert after context-sep-redo separator
            const redoSeparator = contextMenu.querySelector("#context-sep-redo");
            if (redoSeparator) {
                if (redoSeparator.nextSibling) {
                    contextMenu.insertBefore(menuItem, redoSeparator.nextSibling);
                } else {
                    contextMenu.appendChild(menuItem);
                }
            } else {
                // Final fallback: don't add the menu item if neither element is found
                return;
            }
        }

        contextMenu.addEventListener("popupshowing", updateContextMenuVisibility);
    }

    function handleContextMenuClick() {
        let selectedText = "";
        

        if (typeof gContextMenu !== 'undefined' && gContextMenu.selectedText) {
            selectedText = gContextMenu.selectedText.trim();
        } else {
            console.error("Error getting selected text:", e);
        }
        
        if (selectedText && selectedText.trim()) {
            // Show the container first, then perform the search
            showQuickSearchContainer();
            setTimeout(() => {
                handleQuickSearch(selectedText.trim(), CONTEXT_MENU_ENGINE);
            }, 100);
        }
    }

    function updateContextMenuVisibility(event) {
        const menuItem = document.getElementById("quicksearch-context-menuitem");
        if (!menuItem) {
            return;
        }
        let hasSelection = false;
        let selectedText = "";

        if (typeof gContextMenu !== 'undefined') {
            hasSelection = gContextMenu.isTextSelected === true;
            if (hasSelection && gContextMenu.selectedText) {
                selectedText = gContextMenu.selectedText.trim();
            }
        }
        
        menuItem.hidden = !hasSelection;
    }

    setTimeout(init, 1000);
})();
