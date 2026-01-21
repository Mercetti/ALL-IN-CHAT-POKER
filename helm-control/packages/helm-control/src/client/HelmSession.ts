/**
 * Helm Session - Session Management
 * Simple session handling for Helm Control
 */

export class HelmSession {
  constructor(
    private context: object,
    private skills: any,
    private stability: any,
    private audit: any
  ) {}

  async send(input: string) {
    this.stability.check()
    this.audit.log("input", input)
    return { response: "Handled by persona + skills" }
  }

  end() {
    this.audit.log("session_end", this.context)
  }
}
