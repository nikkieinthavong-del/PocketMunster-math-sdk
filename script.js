// Calculator state
let display = document.getElementById('display');
let currentInput = '0';
let shouldResetDisplay = false;
let lastOperator = null;
let lastOperand = null;

// Initialize the calculator
function initCalculator() {
    display.value = currentInput;
    
    // Add keyboard support
    document.addEventListener('keydown', handleKeyPress);
    
    // Prevent manual input in display
    display.addEventListener('keydown', (e) => {
        e.preventDefault();
    });
}

// Handle keyboard input
function handleKeyPress(event) {
    const key = event.key;
    
    // Numbers and decimal point
    if ((key >= '0' && key <= '9') || key === '.') {
        appendToDisplay(key);
    }
    // Operations
    else if (['+', '-', '*', '/'].includes(key)) {
        appendToDisplay(key);
    }
    // Equals
    else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculateResult();
    }
    // Clear
    else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearDisplay();
    }
    // Backspace
    else if (key === 'Backspace') {
        deleteLast();
    }
}

// Append character to display
function appendToDisplay(value) {
    // Remove error state if present
    display.classList.remove('error');
    
    // Reset display if needed
    if (shouldResetDisplay) {
        currentInput = '0';
        shouldResetDisplay = false;
    }
    
    // Handle decimal point
    if (value === '.') {
        // Don't allow multiple decimal points in current number
        const parts = currentInput.split(/[\+\-\*\/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) {
            return;
        }
        
        // If display shows 0 or ends with operator, start with "0."
        if (currentInput === '0' || /[\+\-\*\/]$/.test(currentInput)) {
            currentInput += (currentInput === '0' ? '' : '0') + '.';
        } else {
            currentInput += '.';
        }
    }
    // Handle operators
    else if (['+', '-', '*', '/'].includes(value)) {
        // Convert display symbols to actual operators
        const operator = value === '×' ? '*' : value === '÷' ? '/' : value;
        
        // Don't allow consecutive operators (except minus for negative numbers)
        if (/[\+\-\*\/]$/.test(currentInput)) {
            if (operator === '-' && !/\-$/.test(currentInput)) {
                currentInput += operator;
            } else {
                // Replace the last operator
                currentInput = currentInput.slice(0, -1) + operator;
            }
        } else {
            currentInput += operator;
        }
    }
    // Handle numbers
    else {
        if (currentInput === '0' && value !== '0') {
            currentInput = value;
        } else if (currentInput !== '0') {
            currentInput += value;
        }
    }
    
    // Update display with visual operators
    displayValue = currentInput
        .replace(/\*/g, '×')
        .replace(/\//g, '÷');
    
    display.value = displayValue;
}

// Clear the display
function clearDisplay() {
    currentInput = '0';
    display.value = currentInput;
    display.classList.remove('error');
    shouldResetDisplay = false;
    lastOperator = null;
    lastOperand = null;
}

// Delete last character
function deleteLast() {
    display.classList.remove('error');
    
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = '0';
    }
    
    // Update display with visual operators
    displayValue = currentInput
        .replace(/\*/g, '×')
        .replace(/\//g, '÷');
    
    display.value = displayValue;
}

// Calculate and display result
function calculateResult() {
    try {
        // Remove error state
        display.classList.remove('error');
        
        // Prepare expression for evaluation
        let expression = currentInput;
        
        // Check for division by zero
        if (/\/0(?!\.)/.test(expression)) {
            showError('Cannot divide by zero');
            return;
        }
        
        // Evaluate the expression
        let result = evaluateExpression(expression);
        
        // Handle the result
        if (!isFinite(result)) {
            showError('Invalid operation');
            return;
        }
        
        // Format the result
        if (Number.isInteger(result)) {
            result = result.toString();
        } else {
            // Round to avoid floating point precision issues
            result = parseFloat(result.toPrecision(10)).toString();
        }
        
        // Store for potential repeat calculations
        const lastChar = currentInput[currentInput.length - 1];
        if (!['+', '-', '*', '/'].includes(lastChar)) {
            const operatorMatch = currentInput.match(/[\+\-\*\/][^\+\-\*\/]*$/);
            if (operatorMatch) {
                lastOperator = operatorMatch[0][0];
                lastOperand = operatorMatch[0].slice(1);
            }
        }
        
        currentInput = result;
        display.value = result;
        shouldResetDisplay = true;
        
    } catch (error) {
        showError('Invalid expression');
    }
}

// Safe expression evaluation
function evaluateExpression(expr) {
    // Remove any non-mathematical characters for security
    const sanitized = expr.replace(/[^0-9\+\-\*\/\.\(\)]/g, '');
    
    // Check for empty expression
    if (!sanitized || sanitized === '') {
        return 0;
    }
    
    // Use Function constructor for safer evaluation than eval
    try {
        return new Function('return ' + sanitized)();
    } catch (e) {
        throw new Error('Invalid expression');
    }
}

// Show error message
function showError(message) {
    display.value = message;
    display.classList.add('error');
    currentInput = '0';
    shouldResetDisplay = true;
    
    // Clear error after 2 seconds
    setTimeout(() => {
        if (display.classList.contains('error')) {
            clearDisplay();
        }
    }, 2000);
}

// Format number for display
function formatNumber(num) {
    // Convert to string to work with
    let str = num.toString();
    
    // Handle very large or very small numbers
    if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
        return num.toExponential(6);
    }
    
    return str;
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', initCalculator);

// Add visual feedback for button presses
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(2px)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = '';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
});

// Prevent right-click context menu on calculator
document.addEventListener('contextmenu', function(e) {
    if (e.target.closest('.calculator')) {
        e.preventDefault();
    }
});