import React, { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'
import { useAuth } from '../../contexts/AuthContext'
import { User, Settings, LogOut, Shield, CreditCard } from 'lucide-react'

const UserAvatar = ({ showName = true, size = 'default' }) => {
  const { user, signOut, userEmail, userMetadata } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  if (!user) return null

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
    } finally {
      setIsLoading(false)
    }
  }

  const getUserInitials = () => {
    if (userMetadata?.name) {
      return userMetadata.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase()
    }
    
    return 'U'
  }

  const getUserDisplayName = () => {
    return userMetadata?.name || userEmail?.split('@')[0] || 'User'
  }

  const avatarSize = size === 'small' ? 'h-8 w-8' : size === 'large' ? 'h-12 w-12' : 'h-10 w-10'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
        <Avatar className={avatarSize}>
          <AvatarImage 
            src={userMetadata?.avatar_url || userMetadata?.picture} 
            alt={getUserDisplayName()} 
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        
        {showName && (
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-900 truncate max-w-32">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-32">
              {userEmail}
            </p>
          </div>
        )}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{getUserDisplayName()}</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer">
          <Shield className="mr-2 h-4 w-4" />
          <span>Security</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserAvatar