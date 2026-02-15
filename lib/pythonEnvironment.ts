/**
 * Python Environment Setup
 * 
 * Ensures default Python packages are installed in the execution environment.
 * Packages are installed once and cached to avoid repeated installations.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn } from "child_process";

const DEFAULT_PACKAGES = [
  "numpy",
  "pandas",
  "matplotlib",
  "seaborn",
  "requests",
  "flask",
  "fastapi",
  "scikit-learn",
];

const SETUP_FLAG_FILE = path.join(os.tmpdir(), "buildwithme_python_setup.flag");

/**
 * Check if Python environment has been set up
 */
function isEnvironmentSetup(): boolean {
  try {
    return fs.existsSync(SETUP_FLAG_FILE);
  } catch {
    return false;
  }
}

/**
 * Mark environment as set up
 */
function markEnvironmentSetup(): void {
  try {
    fs.writeFileSync(SETUP_FLAG_FILE, JSON.stringify({ setupAt: Date.now() }), "utf-8");
  } catch (error) {
    console.warn("Failed to mark environment as set up:", error);
  }
}

/**
 * Get Python site-packages paths
 */
function getPythonSitePaths(pythonCommand: string): Promise<string> {
  return new Promise((resolve) => {
    const siteProcess = spawn(pythonCommand, ["-c", "import site; import os; print(os.pathsep.join([site.getusersitepackages()] + site.getsitepackages()))"], {
      stdio: "pipe",
      env: {
        PATH: process.env.PATH || "",
        PYTHONUNBUFFERED: "1",
      },
    });

    let pathOutput = "";
    siteProcess.stdout.on("data", (data) => {
      pathOutput += data.toString();
    });

    siteProcess.on("close", () => {
      resolve(pathOutput.trim() || "");
    });

    siteProcess.on("error", () => {
      resolve("");
    });

    setTimeout(() => {
      siteProcess.kill();
      resolve("");
    }, 2000);
  });
}

/**
 * Check if a Python package is installed
 */
async function checkPackageInstalled(packageName: string, pythonCommand: string): Promise<boolean> {
  const pythonPath = await getPythonSitePaths(pythonCommand);
  
  return new Promise((resolve) => {
    const env: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || "",
      PYTHONUNBUFFERED: "1",
    };
    
    if (pythonPath) {
      env.PYTHONPATH = pythonPath;
    }
    
    const checkProcess = spawn(pythonCommand, ["-c", `import ${packageName}`], {
      stdio: "pipe",
      env,
    });

    let stderr = "";
    checkProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    checkProcess.on("close", (code) => {
      resolve(code === 0);
    });

    checkProcess.on("error", () => {
      resolve(false);
    });

    // Timeout after 2 seconds
    setTimeout(() => {
      checkProcess.kill();
      resolve(false);
    }, 2000);
  });
}

/**
 * Install Python packages using pip
 */
function installPackages(packages: string[], pythonCommand: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    // Use pip or pip3 based on Python command
    const pipCommand = pythonCommand === "python" ? "pip" : "pip3";
    
    const installProcess = spawn(pipCommand, ["install", "--quiet", "--user", ...packages], {
      stdio: "pipe",
      env: {
        PATH: process.env.PATH || "",
        PYTHONUNBUFFERED: "1",
      },
    });

    let stdout = "";
    let stderr = "";

    installProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    installProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    installProcess.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({ 
          success: false, 
          error: `Failed to install packages: ${stderr || stdout}` 
        });
      }
    });

    installProcess.on("error", (error) => {
      resolve({ 
        success: false, 
        error: `Failed to run pip: ${error.message}` 
      });
    });

    // Timeout after 60 seconds (package installation can take time)
    setTimeout(() => {
      installProcess.kill();
      resolve({ 
        success: false, 
        error: "Package installation timed out" 
      });
    }, 60000);
  });
}

/**
 * Verify that all default packages are actually importable
 */
async function verifyPackagesInstalled(pythonCommand: string): Promise<boolean> {
  try {
    const pythonPath = await getPythonSitePaths(pythonCommand);
    const verifyCode = DEFAULT_PACKAGES.map(pkg => `import ${pkg}`).join('\n');
    
    const env: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || "",
      PYTHONUNBUFFERED: "1",
    };
    
    if (pythonPath) {
      env.PYTHONPATH = pythonPath;
    }
    
    const verifyProcess = spawn(pythonCommand, ["-c", verifyCode], {
      stdio: "pipe",
      env,
    });

    let stderr = "";
    verifyProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    return new Promise((resolve) => {
      verifyProcess.on("close", (code) => {
        resolve(code === 0);
      });

      verifyProcess.on("error", () => {
        resolve(false);
      });

      setTimeout(() => {
        verifyProcess.kill();
        resolve(false);
      }, 5000);
    });
  } catch {
    return false;
  }
}

/**
 * Get Python user site-packages directory
 */
function getPythonUserSitePackages(pythonCommand: string): Promise<string | null> {
  return new Promise((resolve) => {
    const siteProcess = spawn(pythonCommand, ["-c", "import site; print(site.getusersitepackages())"], {
      stdio: "pipe",
      env: {
        PATH: process.env.PATH || "",
        PYTHONUNBUFFERED: "1",
      },
    });

    let stdout = "";
    siteProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    siteProcess.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        resolve(stdout.trim());
      } else {
        resolve(null);
      }
    });

    siteProcess.on("error", () => {
      resolve(null);
    });

    setTimeout(() => {
      siteProcess.kill();
      resolve(null);
    }, 2000);
  });
}

/**
 * Ensure default Python packages are installed
 * This function is idempotent - it only installs packages once
 */
export async function ensurePythonEnvironment(): Promise<{ success: boolean; error?: string }> {
  // Determine Python command
  const pythonCommand = process.platform === "win32" ? "python" : "python3";

  try {
    // First, verify if packages are already installed and importable
    const isVerified = await verifyPackagesInstalled(pythonCommand);
    if (isVerified) {
      // All packages are installed and working
      if (!isEnvironmentSetup()) {
        markEnvironmentSetup();
      }
      return { success: true };
    }

    // Check if setup was attempted before (to avoid repeated failures)
    if (isEnvironmentSetup()) {
      // Setup was attempted but verification failed - try again
      // Remove flag to allow retry
      try {
        fs.unlinkSync(SETUP_FLAG_FILE);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Check which packages are missing
    const missingPackages: string[] = [];

    for (const pkg of DEFAULT_PACKAGES) {
      const isInstalled = await checkPackageInstalled(pkg, pythonCommand);
      if (!isInstalled) {
        missingPackages.push(pkg);
      }
    }

    // If all packages are already installed but verification failed, 
    // it might be a PYTHONPATH issue - try installing anyway to ensure they're accessible
    if (missingPackages.length === 0) {
      // Packages exist but might not be importable - reinstall to ensure accessibility
      console.log("Packages detected but not importable - reinstalling to ensure accessibility");
      missingPackages.push(...DEFAULT_PACKAGES);
    }

    // Install missing packages
    console.log(`Installing default Python packages: ${missingPackages.join(", ")}`);
    const result = await installPackages(missingPackages, pythonCommand);

    if (!result.success) {
      console.error("Failed to install Python packages:", result.error);
      return result;
    }

    // Verify installation succeeded
    console.log("Verifying package installation...");
    const verified = await verifyPackagesInstalled(pythonCommand);
    
    if (verified) {
      markEnvironmentSetup();
      console.log("Default Python packages installed and verified successfully");
      return { success: true };
    } else {
      console.warn("Packages installed but verification failed - may be a PYTHONPATH issue");
      // Still mark as set up to avoid repeated attempts, but log the issue
      markEnvironmentSetup();
      return { 
        success: false, 
        error: "Packages installed but not importable. Check PYTHONPATH configuration." 
      };
    }
  } catch (error) {
    console.error("Error setting up Python environment:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

