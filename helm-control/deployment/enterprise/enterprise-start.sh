#!/bin/bash
# Helm Control Enterprise Startup Script
# Includes tamper detection and mandatory license validation

set -euo pipefail

# Constants
ENGINE_BINARY="/app/helm-engine"
EXPECTED_HASH="a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890"
LICENSE_FILE="/license/helm.json"
LOCK_FILE="/app/.helm.lock"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Emergency lock function
emergency_lock() {
    local reason="$1"
    log_error "HELM EMERGENCY LOCK: $reason"
    echo "$(date): $reason" > "$LOCK_FILE"
    
    # Kill all processes gracefully
    if [ -f "/app/.helm.pid" ]; then
        kill -TERM $(cat "/app/.helm.pid") 2>/dev/null || true
        sleep 5
        kill -KILL $(cat "/app/.helm.pid") 2>/dev/null || true
        rm -f "/app/.helm.pid"
    fi
    
    exit 1
}

# Tamper detection
verify_binary_integrity() {
    log_info "Verifying binary integrity..."
    
    if [ ! -f "$ENGINE_BINARY" ]; then
        emergency_lock "Engine binary not found"
    fi
    
    # Check file permissions
    if [ "$(stat -c %a "$ENGINE_BINARY")" != "500" ]; then
        emergency_lock "Engine binary permissions modified"
    fi
    
    # Calculate hash (simplified for demo)
    local current_hash
    current_hash=$(sha256sum "$ENGINE_BINARY" | cut -d' ' -f1)
    
    if [ "$current_hash" != "$EXPECTED_HASH" ]; then
        emergency_lock "Engine binary tampered: hash mismatch"
    fi
    
    log_info "Binary integrity verified"
}

# License validation
validate_license() {
    log_info "Validating enterprise license..."
    
    if [ ! -f "$LICENSE_FILE" ]; then
        emergency_lock "License file not found"
    fi
    
    # Check license file permissions
    if [ "$(stat -c %a "$LICENSE_FILE")" != "400" ]; then
        emergency_lock "License file permissions modified"
    fi
    
    # Parse license (simplified validation)
    if ! grep -q '"license_id"' "$LICENSE_FILE"; then
        emergency_lock "Invalid license format"
    fi
    
    # Check expiration (simplified)
    local expiry
    expiry=$(grep '"expires"' "$LICENSE_FILE" | cut -d'"' -f4)
    local expiry_timestamp=$(date -d "$expiry" +%s 2>/dev/null || echo "0")
    local current_timestamp=$(date +%s)
    
    if [ "$current_timestamp" -gt "$expiry_timestamp" ]; then
        emergency_lock "License expired"
    fi
    
    log_info "License validated successfully"
}

# Check-in validation
validate_checkin() {
    log_info "Validating mandatory check-in..."
    
    # Check if check-in is required
    if [ "${HELM_CHECKIN_REQUIRED:-true}" != "true" ]; then
        log_warn "Check-in not required"
        return 0
    fi
    
    # Perform check-in
    local checkin_url="https://helmcontrol.ai/checkin"
    local license_id
    license_id=$(grep '"license_id"' "$LICENSE_FILE" | cut -d'"' -f4)
    
    local response
    response=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $license_id" \
        -H "Content-Type: application/json" \
        -d "{\"nodeId\":\"${HELM_NODE_ID:-unknown}\",\"version\":\"${HELM_VERSION:-1.0.0}\"}" \
        "$checkin_url" || echo "000")
    
    local http_code="${response: -3}"
    
    if [ "$http_code" != "200" ]; then
        emergency_lock "License check-in failed: HTTP $http_code"
    fi
    
    log_info "Check-in validated"
}

# Environment validation
validate_environment() {
    log_info "Validating environment..."
    
    # Check required environment variables
    local required_vars=("HELM_LICENSE_PATH" "HELM_CHECKIN_REQUIRED" "HELM_TAMPER_DETECTION")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            emergency_lock "Required environment variable not set: $var"
        fi
    done
    
    # Validate tamper detection setting
    if [ "${HELM_TAMPER_DETECTION}" != "true" ]; then
        emergency_lock "Tamper detection must be enabled"
    fi
    
    log_info "Environment validated"
}

# Start Helm engine
start_engine() {
    log_info "Starting Helm Control Engine..."
    
    # Create PID file
    echo $$ > "/app/.helm.pid"
    
    # Start the engine
    exec "$ENGINE_BINARY" \
        --license="$LICENSE_FILE" \
        --checkin="${HELM_CHECKIN_REQUIRED}" \
        --node-id="${HELM_NODE_ID:-helm-node-1}" \
        --log-level="${HELM_LOG_LEVEL:-info}" \
        --port="${HELM_PORT:-8080}"
}

# Cleanup function
cleanup() {
    log_info "Shutting down Helm Control..."
    
    if [ -f "/app/.helm.pid" ]; then
        local pid=$(cat "/app/.helm.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill -TERM "$pid"
            sleep 5
            if kill -0 "$pid" 2>/dev/null; then
                kill -KILL "$pid"
            fi
        fi
        rm -f "/app/.helm.pid"
    fi
    
    log_info "Helm Control shutdown complete"
}

# Main execution
main() {
    log_info "Helm Control Enterprise Startup"
    log_info "Version: ${HELM_VERSION:-1.0.0}"
    log_info "Node ID: ${HELM_NODE_ID:-helm-node-1}"
    
    # Set up signal handlers
    trap cleanup EXIT
    trap 'emergency_lock "Received termination signal"' TERM INT
    
    # Validation sequence
    validate_environment
    verify_binary_integrity
    validate_license
    validate_checkin
    
    # Start the engine
    start_engine
}

# Execute main function
main "$@"
