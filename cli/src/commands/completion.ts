import { Command } from 'commander';

export function registerCompletion(program: Command): void {
  program
    .command('completion')
    .description('Generate shell completions (bash, zsh, fish)')
    .argument('[shell]', 'shell type (bash|zsh|fish)', 'bash')
    .action((shell: string) => {
      const cmds = program.commands.map(c => c.name()).sort().join(' ');
      const sh = shell.toLowerCase();
      if (sh === 'bash') {
        console.log(bashCompletion(cmds));
      } else if (sh === 'zsh') {
        console.log(zshCompletion(cmds));
      } else if (sh === 'fish') {
        console.log(fishCompletion(cmds));
      } else {
        console.error(`Unknown shell: ${shell} — use bash, zsh, or fish`);
        process.exit(1);
      }
    });
}

function bashCompletion(cmds: string): string {
  return `# claude-system bash completion
# Install: claude-system completion bash > ~/.bash_completion.d/claude-system
# or: echo 'source <(claude-system completion bash)' >> ~/.bashrc
_claude_system_completion() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local cmds="${cmds} --help --version"
  if [ $COMP_CWORD -eq 1 ]; then
    COMPREPLY=( $(compgen -W "$cmds" -- "$cur") )
  else
    case "\${COMP_WORDS[1]}" in
      list) COMPREPLY=( $(compgen -W "--installed --available --category --help" -- "$cur") ) ;;
      search|info|install|remove|uninstall|run|update|report) COMPREPLY=( $(compgen -W "--help" -- "$cur") ) ;;
      create|validate) COMPREPLY=( $(compgen -f -- "$cur") ) ;;
      doctor|completion) COMPREPLY=( $(compgen -W "--help bash zsh fish" -- "$cur") ) ;;
      *) COMPREPLY=() ;;
    esac
  fi
}
complete -F _claude_system_completion claude-system
`;
}

function zshCompletion(cmds: string): string {
  return `#compdef claude-system
# claude-system zsh completion
# Install: claude-system completion zsh > ~/.zsh/completions/_claude-system
# or: echo 'source <(claude-system completion zsh)' >> ~/.zshrc
_claude_system() {
  local -a completions
  local -a commands
  commands=(list: search: info: install: remove: update: run: create: validate: report: doctor: completion:)
  _arguments -C \
    "1: :->cmds" \
    "*::arg:->args"
  case $state in
    cmds) _describe 'command' commands ;;
    args) case $words[1] in
      list) _arguments "--installed[installed only]" "--available[available only]" "--category[filter]" ;;
      completion) _arguments "1:shell:(bash zsh fish)" ;;
    esac ;;
  esac
}
(( $+functions[compdef] )) && compdef _claude_system claude-system
`;
}

function fishCompletion(cmds: string): string {
  return `# claude-system fish completion
# Install: claude-system completion fish > ~/.config/fish/completions/claude-system.fish
for cmd in ${cmds}
  complete -c claude-system -n "__fish_use_subcommand" -a $cmd -d "claude-system $cmd"
end
complete -c claude-system -n "__fish_use_subcommand" -l help -d "display help"
complete -c claude-system -n "__fish_use_subcommand" -l version -d "output version"
`;
}
