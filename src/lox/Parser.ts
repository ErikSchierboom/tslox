import { Expr, GroupingExpr, LiteralExpr, LogicalExpr } from "./Expr";
import { ParseError } from "./ParseError";
import { Token, TokenType } from "./Tokens";

export type Precedence =
  | "PREC_NONE"
  | "PREC_ASSIGNMENT" // =
  | "PREC_OR"         // or
  | "PREC_AND"        // and
  | "PREC_EQUALITY"   // == !=
  | "PREC_COMPARISON" // < > <= >=
  | "PREC_TERM"       // + -
  | "PREC_FACTOR"     // * /
  | "PREC_UNARY"      // ! -
  | "PREC_CALL"       // . ()
  | "PREC_PRIMARY";

export class Parser {
  private rules: { [type: TokenType]: ParseRule } = {
    ["TOKEN_LEFT_PAREN"]    : this.makeRule(this.grouping, null,   "PREC_NONE"),
    ["TOKEN_RIGHT_PAREN"]   : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_LEFT_BRACE"]    : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_RIGHT_BRACE"]   : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_COMMA"]         : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_DOT"]           : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_MINUS"]         : this.makeRule(this.unary,    this.binary, "PREC_TERM"),
    ["TOKEN_PLUS"]          : this.makeRule(null,     this.binary, "PREC_TERM"),
    ["TOKEN_SEMICOLON"]     : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_SLASH"]         : this.makeRule(null,     this.binary, "PREC_FACTOR"),
    ["TOKEN_STAR"]          : this.makeRule(null,     this.binary, "PREC_FACTOR"),
    ["TOKEN_BANG"]          : this.makeRule(this.unary,    null,   "PREC_NONE"),
    ["TOKEN_BANG_EQUAL"]    : this.makeRule(null,     this.binary, "PREC_EQUALITY"),
    ["TOKEN_EQUAL"]         : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_EQUAL_EQUAL"]   : this.makeRule(null,     this.binary, "PREC_EQUALITY"),
    ["TOKEN_GREATER"]       : this.makeRule(null,     this.binary, "PREC_COMPARISON"),
    ["TOKEN_GREATER_EQUAL"] : this.makeRule(null,     this.binary, "PREC_COMPARISON"),
    ["TOKEN_LESS"]          : this.makeRule(null,     this.binary, "PREC_COMPARISON"),
    ["TOKEN_LESS_EQUAL"]    : this.makeRule(null,     this.binary, "PREC_COMPARISON"),
    ["TOKEN_IDENTIFIER"]    : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_STRING"]        : this.makeRule(this.string,   null,   "PREC_NONE"),
    ["TOKEN_NUMBER"]        : this.makeRule(this.number,   null,   "PREC_NONE"),
    ["TOKEN_AND"]           : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_CLASS"]         : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_ELSE"]          : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_FALSE"]         : this.makeRule(this.literal,  null,   "PREC_NONE"),
    ["TOKEN_FOR"]           : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_FUN"]           : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_IF"]            : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_NIL"]           : this.makeRule(this.literal,  null,   "PREC_NONE"),
    ["TOKEN_OR"]            : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_PRINT"]         : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_RETURN"]        : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_SUPER"]         : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_THIS"]          : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_TRUE"]          : this.makeRule(this.literal,  null,   "PREC_NONE"),
    ["TOKEN_VAR"]           : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_WHILE"]         : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_ERROR"]         : this.makeRule(null,     null,   "PREC_NONE"),
    ["TOKEN_EOF"]           : this.makeRule(null,     null,   "PREC_NONE"),
  };

  private current!: Token;
  private previous!: Token;
  private hadError: boolean = false;
  private panicMode: boolean = false;

  private literal(): Expr {
    switch (this.previous.type) {
      case "TOKEN_FALSE": return new LiteralExpr(false);
      case "TOKEN_TRUE": return new LiteralExpr(true);
      case "TOKEN_NIL": return new LiteralExpr(null);
      default: throw new Error("Unreachable"); // TODO: make this prettier
    }
  }

  private binary(): Expr {
    const operatorType: TokenType = this.previous.type;
    const rule = this.getRule(operatorType);
    this.parsePrecedence(rule->precedence + 1);
  
    switch (operatorType) {
      case "TOKEN_BANG_EQUAL":  emitBytes(OP_EQUAL, OP_NOT); break;
      case "TOKEN_EQUAL_EQUAL":  emitByte(OP_EQUAL); break;
      case "TOKEN_GREATER":  emitByte(OP_GREATER); break;
      case "TOKEN_GREATER_EQUAL":  emitBytes(OP_LESS, OP_NOT); break;
      case "TOKEN_LESS":  emitByte(OP_LESS); break;
      case "TOKEN_LESS_EQUAL":  emitBytes(OP_GREATER, OP_NOT); break;
      case "TOKEN_PLUS":  emitByte(OP_ADD); break;
      case "TOKEN_MINUS": emitByte(OP_SUBTRACT); break;
      case "TOKEN_STAR":  emitByte(OP_MULTIPLY); break;
      case "TOKEN_SLASH": emitByte(OP_DIVIDE); break;
      default: return;
    }
  }
  
  private expression(): Expr {
    return this.parsePrecedence("PREC_ASSIGNMENT");
  }
  
  private grouping(): Expr {
    const expr = this.expression();
    this.consume("TOKEN_RIGHT_PAREN", "Expect ')' after expression.");
    return new GroupingExpr(expr);
  }
  
  // TODO: maybe join with literal
  private number(): Expr {
    return new LiteralExpr(this.previous.literal); // TODO: check if use previous or current
  }
  
  // TODO: maybe join with literal
  private string(): Expr {
    return new LiteralExpr(this.previous.literal); // TODO: check if use previous or current
  }
  
  private unary(): Expr {
    const operatorType: TokenType = this.previous.type;
  
    // Compile the operand
    this.parsePrecedence("PREC_UNARY");
  
    switch (operatorType) {
      case "TOKEN_BANG": new LogicalExpr(); break;
      case "TOKEN_MINUS": emitByte(OP_NEGATE); break;
      default: throw new Error();
    }
  }

  private getRule(type: TokenType): ParseRule {
    return this.rules[type];
  }

  private makeRule(prefix: ParseFn | null, infix: ParseFn | null, precedence: Precedence): ParseRule {
    return { prefix, infix, precedence };
  }
}

export type ParseFn = () => {};

export type ParseRule = {
  prefix: ParseFn | null;
  infix : ParseFn | null;
  precedence: Precedence;
}

static void errorAt(Token *token, const char *message) {
  if (parser.panicMode) return;
  parser.panicMode = true;

  fprintf(stderr, "[line %d] Error", token->line);

  if (token->type == TOKEN_EOF) {
    fprintf(stderr, " at end");
  } else if (token->type == TOKEN_ERROR) {
    // Nothing
  } else {
    fprintf(stderr, " at '%.*s'", token->length, token->start);
  }

  fprintf(stderr, ": %s\n", message);
  parser.hadError = true;
}

static void errorAtCurrent(const char *message) {
  errorAt(&parser.current, message);
}

static void error(const char* message) {
  errorAt(&parser.previous, message);
}

static void advance() {
  parser.previous = parser.current;

  for (;;) {
    parser.current = scanToken();
    if (parser.current.type != TOKEN_ERROR) break;

    errorAtCurrent(parser.current.start);
  }
}

static void consume(TokenType type, const char *message) {
  if (parser.current.type == type) {
    advance();
    return;
  }

  errorAtCurrent(message);
}


static void endCompiler() {
  emitReturn();
#ifdef DEBUG_PRINT_CODE
  if (!parser.hadError) {
    disassembleChunk(currentChunk(), "code");
  }
#endif
}





static void parsePrecedence(Precedence "PRECedence) {
  advance();
  ParseFn prefixRule = getRule(parser.previous.type)->prefix;
  if (prefixRule == null) {
    error("Expect expression.");
    return;
  }

  prefixRule();

  while (precedence <= getRule(parser.current.type)->precedence) {
    advance();
    ParseFn infixRule = getRule(parser.previous.type)->infix;
    infixRule();
  }
}



bool compile(const char* source, Chunk* chunk) {
  initScanner(source);
  compilingChunk = chunk;

  parser.hadError = false;
  parser.panicMode = false;

  advance();
  expression();
  consume(TOKEN_EOF, "Expect end of expression");
  endCompiler();
  return !parser.hadError;
}
