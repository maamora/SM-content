package com.maamora.studio.repository;

import com.maamora.studio.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, String> {
    List<Post> findByBatchJobId(String batchJobId);
    Optional<Post> findByIdAndProduct_Brand_Id(String id, String brandId);
    List<Post> findByProduct_Brand_IdOrderByCreatedAtDesc(String brandId);

    /**
     * Same lookup as findByIdAndProduct_Brand_Id, but eagerly loads the
     * Product in the same query (JOIN FETCH) instead of leaving it as a lazy
     * proxy. Caption generation reads post.getProduct().getName()/etc. — with
     * a lazy proxy, that only works while the DB session that loaded the Post
     * is still open, which single requests get "for free" from Spring's
     * open-in-view but batch's background thread pool does not, so it threw
     * LazyInitializationException there. Fetching it eagerly here means the
     * Product's fields are already loaded into memory, safe to read from any
     * thread, no open session or long-lived transaction required at all.
     */
    @Query("SELECT p FROM Post p JOIN FETCH p.product WHERE p.id = :id AND p.product.brand.id = :brandId")
    Optional<Post> findByIdAndProduct_Brand_IdFetchProduct(@Param("id") String id, @Param("brandId") String brandId);
}
