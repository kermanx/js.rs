import type { CodeInformation } from "@volar/language-core";

export const raw = {
  all: {
    semantic: true,
    completion: true,
    navigation: true,
    verification: true
  },
  verification: {
    verification: true
  },
} satisfies Record<string, CodeInformation>;

export const codeFeatures = raw as {
  [T in keyof typeof raw]: CodeInformation;
};
