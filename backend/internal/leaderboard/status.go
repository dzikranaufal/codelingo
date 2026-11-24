package leaderboard

import "strings"

var allowedStatuses = map[string]struct{}{
    "🔥": {},
    "⚡ ": {},
    "🚀": {},
    "💻": {},
    "🎯": {},
    "📚": {},
    "🏆": {},
    "⭐": {},
	"😎": {},
	"🎉": {},
	"💪": {},
	"👀": {},
	"🍿": {},
	"🤓": {},
	"💯": {},
}

func NormalizeStatus(raw string) (string, bool) {
    status := strings.TrimSpace(raw)

    if status == "" {
        return "", true
    }

    if _, ok := allowedStatuses[status]; !ok {
        return "", false
    }

    return status, true
}