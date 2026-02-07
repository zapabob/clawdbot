Write-Host "OpenClaw Launcher starting..."

$PROJECT_DIR = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"

if (-not (Test-Path $PROJECT_DIR)) {
    [System.Windows.Forms.MessageBox]::Show("Project directory not found: $PROJECT_DIR", "Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    exit 1
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "OpenClaw Launcher"
$form.Size = New-Object System.Drawing.Size(400, 400)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false

$label = New-Object System.Windows.Forms.Label
$label.Text = "Select option:"
$label.Location = New-Object System.Drawing.Point(20, 15)
$label.AutoSize = $true
$form.Controls.Add($label)

$results = @{}

$btn1 = New-Object System.Windows.Forms.Button
$btn1.Text = "1. Gateway + MCP"
$btn1.Location = New-Object System.Drawing.Point(20, 50)
$btn1.Size = New-Object System.Drawing.Size(340, 40)
$btn1.Add_Click({ $results.choice = 1; $form.Close() })
$form.Controls.Add($btn1)

$btn2 = New-Object System.Windows.Forms.Button
$btn2.Text = "2. Web UI"
$btn2.Location = New-Object System.Drawing.Point(20, 100)
$btn2.Size = New-Object System.Drawing.Size(340, 40)
$btn2.Add_Click({ $results.choice = 2; $form.Close() })
$form.Controls.Add($btn2)

$btn3 = New-Object System.Windows.Forms.Button
$btn3.Text = "3. Dev Mode"
$btn3.Location = New-Object System.Drawing.Point(20, 150)
$btn3.Size = New-Object System.Drawing.Size(340, 40)
$btn3.Add_Click({ $results.choice = 3; $form.Close() })
$form.Controls.Add($btn3)

$btn4 = New-Object System.Windows.Forms.Button
$btn4.Text = "4. Build"
$btn4.Location = New-Object System.Drawing.Point(20, 200)
$btn4.Size = New-Object System.Drawing.Size(340, 40)
$btn4.Add_Click({ $results.choice = 4; $form.Close() })
$form.Controls.Add($btn4)

$btn5 = New-Object System.Windows.Forms.Button
$btn5.Text = "5. MCP Only"
$btn5.Location = New-Object System.Drawing.Point(20, 250)
$btn5.Size = New-Object System.Drawing.Size(340, 40)
$btn5.Add_Click({ $results.choice = 5; $form.Close() })
$form.Controls.Add($btn5)

$btn0 = New-Object System.Windows.Forms.Button
$btn0.Text = "0. Exit"
$btn0.Location = New-Object System.Drawing.Point(20, 300)
$btn0.Size = New-Object System.Drawing.Size(340, 40)
$btn0.BackColor = [System.Drawing.Color]::LightGray
$btn0.Add_Click({ $results.choice = 0; $form.Close() })
$form.Controls.Add($btn0)

$form.ShowDialog() | Out-Null

if ($results.choice -eq $null -or $results.choice -eq 0) {
    Write-Host "User exited"
    exit 0
}

Write-Host "User selected: $($results.choice)"

$ErrorActionPreference = "Continue"

switch ($results.choice) {
    1 {
        Write-Host "Starting Gateway + MCP..."
        $p = Start-Process -PassThru -FilePath "node" -ArgumentList "start-mcp.js" -WorkingDirectory $PROJECT_DIR -NoNewWindow
        if ($p) { Write-Host "Started successfully (PID: $($p.Id))" }
    }
    2 {
        Write-Host "Starting Web UI..."
        $p = Start-Process -PassThru -FilePath "node" -ArgumentList "scripts\run-node.mjs", "tui" -WorkingDirectory $PROJECT_DIR -NoNewWindow
        if ($p) { Write-Host "Started successfully (PID: $($p.Id))" }
    }
    3 {
        Write-Host "Starting Dev Mode..."
        $p = Start-Process -PassThru -FilePath "node" -ArgumentList "scripts\run-node.mjs", "--dev" -WorkingDirectory $PROJECT_DIR -NoNewWindow
        if ($p) { Write-Host "Started successfully (PID: $($p.Id))" }
    }
    4 {
        Write-Host "Starting Build..."
        Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$PROJECT_DIR`" && pnpm build" -WorkingDirectory $PROJECT_DIR
    }
    5 {
        Write-Host "Starting MCP Server..."
        $p = Start-Process -PassThru -FilePath "node" -ArgumentList "gemini-mcp-server.js" -WorkingDirectory $PROJECT_DIR -NoNewWindow
        if ($p) { Write-Host "Started successfully (PID: $($p.Id))" }
    }
}

Write-Host "Done"
