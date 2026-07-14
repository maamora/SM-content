package com.maamora.studio.security;

import com.maamora.studio.model.User;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Loads the authenticated principal by USER ID (not email).
 * The JWT subject claim is the user id, so this is what JwtAuthFilter calls
 * after validating the token. Login itself (email + password) is handled
 * directly in AuthService, without going through this service.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("No user with id " + userId));

        return new org.springframework.security.core.userdetails.User(
                user.getId(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
