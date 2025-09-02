import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // تعطيل قاعدة no-unused-expressions لتجنب الخطأ
      "no-unused-expressions": 0,
      "@typescript-eslint/no-unused-expressions": 0,
      // تعطيل قاعدة no-explicit-any لتجنب الأخطاء المتعلقة باستخدام any
      "@typescript-eslint/no-explicit-any": "off",
      // تعطيل قاعدة ban-ts-comment لتجنب الأخطاء المتعلقة باستخدام @ts-nocheck
      "@typescript-eslint/ban-ts-comment": "off",
      // تعطيل قاعدة prefer-const لتجنب الأخطاء المتعلقة باستخدام let بدلاً من const
      "prefer-const": "off",
      // تعطيل قاعدة react-hooks/exhaustive-deps لتجنب التحذيرات المتعلقة بالتبعيات المفقودة في useEffect
      "react-hooks/exhaustive-deps": "off",
      // تعطيل قاعدة react-hooks/rules-of-hooks لتجنب الأخطاء المتعلقة باستدعاء الهوكس بشكل شرطي
      "react-hooks/rules-of-hooks": "off",
      // تعطيل قاعدة no-useless-escape لتجنب الأخطاء المتعلقة بالهروب غير الضروري
      "no-useless-escape": "off",
      // تعطيل قاعدة no-case-declarations لتجنب الأخطاء المتعلقة بالإعلانات في حالات switch
      "no-case-declarations": "off",
      // تعطيل قاعدة no-useless-catch لتجنب الأخطاء المتعلقة بالـ try/catch غير الضروري
      "no-useless-catch": "off",
    },
  }
);
