import type { Locale } from "./messages";

/** Copy for the beUI sign-in, sign-up and recovery forms that the shared dictionary does not carry. */
const en = {
	signInTitle: "Welcome back.",
	signUpTitle: "Make it yours.",
	signInDescription: "Sign in to continue to your workspace.",
	signUpDescription: "Create an account to access your personal workspace.",
	brandTitle: "Your next idea.\nA stronger start.",
	brandDescription:
		"Manage your profile, track support requests and access your private files in one workspace.",
	brandStepOne: "Welcome your users",
	brandStepTwo: "Deliver your product",
	brandStepThree: "Grow on your terms",
	brandFootnote: "Your source. Your product. Your next chapter.",
	passwordHint: "Use at least 10 characters.",
	signInTab: "Sign in",
	signUpTab: "Sign up",
	modeSwitcher: "Choose sign in or sign up",
	homeLink: "Back to home",
	submit: "Submit",
	requiredField: "Please complete this field.",
	invalidEmail: "Enter a valid email address.",
	passwordTooShort: "Use at least 10 characters.",
	invalidCredentials:
		"Email or password is incorrect. Check both and try again, or use Forgot password to reset your password.",
	continueWithEmail: "or continue with email",
	continueWithSuffix: "",
	showPassword: "Show password",
	hidePassword: "Hide password",
	legalPrefix: "By continuing, you agree to our",
	legalConnector: "and",
	terms: "Terms",
	privacy: "Privacy Policy",
};

export type AuthPagesCopy = { [K in keyof typeof en]: string };

export const authPagesMessages: Record<Locale, AuthPagesCopy> = {
	en,
	zh: {
		signInTitle: "欢迎回来。",
		signUpTitle: "从这里，开始。",
		signInDescription: "登录账号，继续你的工作。",
		signUpDescription: "创建账号，进入你的专属工作区。",
		brandTitle: "让好想法，\n有一个好起点。",
		brandDescription:
			"在同一个工作台管理个人资料、跟进客服请求并访问自己的私有文件。",
		brandStepOne: "接住第一位用户",
		brandStepTwo: "交付你的产品价值",
		brandStepThree: "按自己的节奏成长",
		brandFootnote: "你的源码。你的产品。你的下一步。",
		passwordHint: "密码至少需要 10 个字符。",
		signInTab: "登录",
		signUpTab: "注册",
		modeSwitcher: "选择登录或注册",
		homeLink: "返回首页",
		submit: "提交",
		requiredField: "请填写此项。",
		invalidEmail: "请输入有效的邮箱地址。",
		passwordTooShort: "密码至少需要 10 个字符。",
		invalidCredentials:
			"邮箱或密码不正确。请检查后重试，或通过「忘记密码」重置密码。",
		continueWithEmail: "或使用邮箱继续",
		continueWithSuffix: "登录",
		showPassword: "显示密码",
		hidePassword: "隐藏密码",
		legalPrefix: "继续即表示你同意我们的",
		legalConnector: "和",
		terms: "服务条款",
		privacy: "隐私政策",
	},
};
