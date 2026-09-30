import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { authApi, type AuthUser, type LoginPayload } from '@/apis/authApi'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload, remember?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null
  })

  const [user, setUser] = useState<AuthUser | null>(() => {
    const cachedUser =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser)
      } catch {
        return null
      }
    }
    return null
  })

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const isRefreshingRef = useRef<boolean>(false)

  // Verify and fetch authenticated user profile on application boot
  const refreshUser = useCallback(async () => {
    if (isRefreshingRef.current) return
    const currentToken =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

    if (!currentToken) {
      setUser(null)
      setToken(null)
      setIsLoading(false)
      return
    }

    isRefreshingRef.current = true
    try {
      const me = await authApi.getMe()
      setUser(me)
      if (localStorage.getItem(TOKEN_KEY)) {
        localStorage.setItem(USER_KEY, JSON.stringify(me))
      } else {
        sessionStorage.setItem(USER_KEY, JSON.stringify(me))
      }
    } catch (err: any) {
      console.warn('Session verification failed or expired:', err)
      // If 401 unauthenticated, clear cache
      if (err?.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('token')
        localStorage.removeItem(USER_KEY)
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(USER_KEY)
        setUser(null)
        setToken(null)
      }
    } finally {
      isRefreshingRef.current = false
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Login handler
  const login = async (payload: LoginPayload, remember = true) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(payload)
      const receivedToken = response.token
      const receivedUser = response.user

      setToken(receivedToken)
      setUser(receivedUser)

      if (remember) {
        localStorage.setItem(TOKEN_KEY, receivedToken)
        localStorage.setItem('token', receivedToken)
        localStorage.setItem(USER_KEY, JSON.stringify(receivedUser))
      } else {
        sessionStorage.setItem(TOKEN_KEY, receivedToken)
        sessionStorage.setItem(USER_KEY, JSON.stringify(receivedUser))
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('token')
        localStorage.removeItem(USER_KEY)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout handler
  const logout = async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
    } catch (err) {
      console.warn('Server logout error (proceeding with local teardown):', err)
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('token')
      localStorage.removeItem(USER_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      setToken(null)
      setUser(null)
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
