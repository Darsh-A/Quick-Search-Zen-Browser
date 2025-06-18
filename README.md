# ⭐ Quick Search - Zen Browser ⭐
Script to quickly search for a word or phrase in the Zen Browser through a pop up thus removing the need to create and swtich to a new tab.

## Search Popup

https://github.com/user-attachments/assets/95702ac2-96bf-478e-8e47-0afa4916c1c2


## Glance Mode




https://github.com/user-attachments/assets/827215fc-e985-4f71-8646-6e3a6b7e624b




## 🔧 Installation

## Method 1:
Through [Sine](https://github.com/CosmoCreeper/Sine)

## Method 2:
## Part 1: Install fx-autoconfig

1. **Download the Files**
   - Go to the [fx-autoconfig GitHub page](https://github.com/MrOtherGuy/fx-autoconfig/tree/master).
   - Click the green `< > Code` button and download the ZIP file.

2. **Navigate to Your Zen Browser Installation Folder**
   - Locate your Zen Browser installation folder:
     - Default location on Windows: `C:\Program Files\Zen Browser`.
     - If unsure, open `about:support` in Zen Browser, and look for the "Application Binary" field.

3. **Extract fx-autoconfig ZIP File**
   - Open the extracted folder and locate the `program` folder. Inside, you’ll find:
     - A `defaults` folder.
     - A `config.js` file.

4. **Move Files to the Installation Folder**
   - You can **merge** or **replace** the files depending on your preferred method:
     - **Merge**:
       - **config.js**: Open the `config.js` file from the ZIP. 
         - If a `config.js` file exists in your Zen Browser folder, copy its content from the ZIP version and paste it into your existing file, then save.
         - If no `config.js` file exists, copy the one from the ZIP directly to your Zen Browser folder.
       - **defaults folder**: Navigate to `defaults > pref > config-prefs.js` both in the ZIP and Zen Browser folder. Open both files, copy the content from the ZIP version, and paste it into the existing file in Zen Browser. If the folder or file doesn’t exist, simply copy the entire `defaults` folder into your Zen Browser folder.
     - **Replace**:
       - Drag and drop the entire `defaults` folder and `config.js` from the ZIP file into the Zen Browser installation folder. Replace any existing files when prompted.

5. **Navigate to Your Zen Profile Folder**
   - Open Zen Browser and go to `about:profiles`.
   - Locate the desired profile, find the "Root Directory," and click "Open Folder."

6. **Copy the Profile Files**
   - Go back to the `profile` folder in the fx-autoconfig ZIP.
   - Copy the `chrome` folder into the profile's root directory.


## Part 2: Install Quick Search

1. **Open the Required Folder**
   - From your profile root folder, navigate to `chrome > JS`.

2. **Download the Quick Search Plugin**
   - Go to the [Quick Search GitHub page](https://github.com/Darsh-A/Quick-Search-Zen-Browser/tree/main).
   - Click the green `< > Code` button and download the ZIP file.

3. **Check Configuration in Zen Browser**
   - Open a new tab, type `about:config`, and press Enter.
   - Look up `zen.urlbar.replace-newtab`. Note whether it is set to `true` or `false`.

4. **Install the Plugin**
   - Extract the Quick Search ZIP file.
   - Depending on the `zen.urlbar.replace-newtab` value:
     - If `false`: Copy `quickSearch_NoBar.uc.js` from the extracted ZIP to the `JS` folder.
     - If `true`: Copy `quickSearch.uc.js` from the extracted ZIP to the `JS` folder.

5. **Clear Startup Cache**
   - Open `about:support` in Zen Browser.
   - Click "Clear startup cache..." in the top-right corner. When prompted, restart the browser.



## ⚙️ Configuration

- Default search engine is set to Google. You can change it by modifying the `defaultEngine` variable in the script config (line 125). 

Additional search engines present:

- DuckDuckGo: `d:`
- Bing: `b:`
- Ecosia: `e:`
- Stackoverflow: `so:`
- Github: `gh:`
- Wikipedia: `wiki:`


- You can change the css of the popup by modifying the `injectCSS` variable in the script (line 14).


- Line 420 addes parameters to the search engine URL. You can add more parameters there.


## 🔍 Usage
Uses Browser Default engines: e.g '@google`
### For the `quickSearch.uc.js` file:
- Open the url bar and type whatever you want to search for.
- Press `Ctrl + Enter` to open the search popup.
- Press `Ctrl + Shift + Enter` to open the search popup in a Glance Mode.

### For the `quickSearch_NoBar.uc.js` file:
- Press `Ctrl+Enter` to open the search popup.
- Then press `Enter` to search the query.

