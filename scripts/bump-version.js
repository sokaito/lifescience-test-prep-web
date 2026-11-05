const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const versionJsonPath = path.join(rootDir, 'public', 'version.json');
const gradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
const packageJsonPath = path.join(rootDir, 'package.json');
const checkerPath = path.join(rootDir, 'src', 'components', 'AppUpdateChecker.tsx');

function bumpVersion(targetVersionCode, targetVersionName) {
  // 1. Read current version.json
  let versionData = { latestVersion: "2.0.0", versionCode: 2 };
  if (fs.existsSync(versionJsonPath)) {
    try {
      versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    } catch (e) {}
  }

  const currentCode = versionData.versionCode || 1;
  const newCode = targetVersionCode ? parseInt(targetVersionCode, 10) : (currentCode + 1);
  
  let newName = targetVersionName;
  if (!newName) {
    if (targetVersionCode) {
      newName = `${targetVersionCode}.0`;
    } else {
      // Auto-increment minor or major
      const parts = (versionData.latestVersion || "2.0.0").split('.').map(Number);
      if (parts.length >= 2) {
        parts[1] = (parts[1] || 0) + 1;
        newName = parts.join('.');
      } else {
        newName = `${newCode}.0`;
      }
    }
  }

  console.log(`Bumping version from Code ${currentCode} (${versionData.latestVersion}) -> Code ${newCode} (${newName})`);

  // 2. Update public/version.json
  versionData.versionCode = newCode;
  versionData.latestVersion = newName;
  if (!versionData.title) versionData.title = `Naya Update Available Hai! (v${newName})`;
  fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + '\n');
  console.log('✓ Updated public/version.json');

  // Also update out/version.json if out exists
  const outVersionPath = path.join(rootDir, 'out', 'version.json');
  if (fs.existsSync(path.join(rootDir, 'out'))) {
    fs.writeFileSync(outVersionPath, JSON.stringify(versionData, null, 2) + '\n');
    console.log('✓ Updated out/version.json');
  }

  // 3. Update android/app/build.gradle
  if (fs.existsSync(gradlePath)) {
    let gradle = fs.readFileSync(gradlePath, 'utf8');
    gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
    gradle = gradle.replace(/versionName\s+["'][^"']+["']/, `versionName "${newName}"`);
    fs.writeFileSync(gradlePath, gradle);
    console.log('✓ Updated android/app/build.gradle');
  }

  // 4. Update package.json
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    pkg.version = newName.includes('.') ? (newName.split('.').length === 2 ? `${newName}.0` : newName) : `${newName}.0.0`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('✓ Updated package.json');
  }

  // 5. Update src/components/AppUpdateChecker.tsx
  if (fs.existsSync(checkerPath)) {
    let checker = fs.readFileSync(checkerPath, 'utf8');
    checker = checker.replace(/const CURRENT_VERSION_CODE = \d+;/, `const CURRENT_VERSION_CODE = ${newCode};`);
    checker = checker.replace(/const CURRENT_VERSION_NAME = "[^"]+";/, `const CURRENT_VERSION_NAME = "${newName}";`);
    fs.writeFileSync(checkerPath, checker);
    console.log('✓ Updated src/components/AppUpdateChecker.tsx');
  }

  console.log(`\n🎉 Success! APK & Web version updated to ${newName} (Code: ${newCode})`);
}

// Support arguments: node bump-version.js [code] [name]
const args = process.argv.slice(2);
const targetCode = args[0];
const targetName = args[1];

bumpVersion(targetCode, targetName);

